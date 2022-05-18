/* eslint-disable no-sync */
import * as distInfo from './dist-info'
import * as gitInfo from '../app/git-info'
import * as packageInfo from '../app/package-info'
import * as platforms from './build-platforms'

if (!distInfo.isPublishable()) {
  console.log('Not a publishable build. Skipping publish.')
  process.exit(0)
}

const releaseSHA = distInfo.getReleaseSHA()
if (releaseSHA == null) {
  console.log(`No release SHA found for build. Skipping publish.`)
  process.exit(0)
}

const currentTipSHA = gitInfo.getSHA()
if (!currentTipSHA.toUpperCase().startsWith(releaseSHA!.toUpperCase())) {
  console.log(
    `Current tip '${currentTipSHA}' does not match release SHA '${releaseSHA}'. Skipping publish.`
  )
  process.exit(0)
}

import * as Fs from 'fs'
import { execSync } from 'child_process'
import * as Azure from 'azure-storage'
import * as Crypto from 'crypto'
import request from 'request'

console.log('Packaging…')
execSync('yarn package', { stdio: 'inherit' })

const sha = platforms.getSha().substring(0, 8)

function getSecret() {
  if (process.env.DEPLOYMENT_SECRET != null) {
    return process.env.DEPLOYMENT_SECRET
  }

  throw new Error(
    `Unable to get deployment secret environment variable. Deployment aborting...`
  )
}

console.log('Uploading…')

let uploadPromise = null
if (process.platform === 'darwin') {
  uploadPromise = uploadOSXAssets()
} else if (process.platform === 'win32') {
  uploadPromise = uploadWindowsAssets()
} else {
  console.error(`I dunno how to publish a release for ${process.platform} :(`)
  process.exit(1)
}

uploadPromise!
  .then(artifacts => {
    const names = artifacts.map(function (item, index) {
      return item.name
    })
    console.log(`Uploaded artifacts: ${names}`)
    return updateDeploy(artifacts, getSecret())
  })
  .catch(e => {
    console.error(`Publishing failed: ${e}`)
    process.exit(1)
  })

function uploadOSXAssets() {
  const uploads = [upload(distInfo.getOSXZipName(), distInfo.getOSXZipPath())]
  return Promise.all(uploads)
}

function uploadWindowsAssets() {
  // For the nuget packages, include the architecture infix in the asset name
  // when they're uploaded.
  const uploads = [
    upload(
      distInfo.getWindowsInstallerName(),
      distInfo.getWindowsInstallerPath()
    ),
    upload(
      distInfo.getWindowsStandaloneName(),
      distInfo.getWindowsStandalonePath()
    ),
    upload(
      distInfo.getWindowsFullNugetPackageName(true),
      distInfo.getWindowsFullNugetPackagePath()
    ),
  ]

  // Even if we should make a delta, it might not exist (if it's the first time
  // we publish a nuget package of the app... for example, when we added support
  // for ARM64).
  if (
    distInfo.shouldMakeDelta() &&
    Fs.existsSync(distInfo.getWindowsDeltaNugetPackagePath())
  ) {
    uploads.push(
      upload(
        distInfo.getWindowsDeltaNugetPackageName(true),
        distInfo.getWindowsDeltaNugetPackagePath()
      )
    )
  }

  return Promise.all(uploads)
}

interface IUploadResult {
  name: string
  url: string
  size: number
  sha: string
}

async function upload(assetName: string, assetPath: string) {
  const azureBlobService = await getAzureBlobService()
  const container = process.env.AZURE_BLOB_CONTAINER || ''
  const cleanAssetName = assetName.replace(/ /g, '')
  const blob = `releases/${packageInfo.getVersion()}-${sha}/${cleanAssetName}`
  const url = `${process.env.AZURE_STORAGE_URL}/${container}/${blob}`

  return new Promise<IUploadResult>((resolve, reject) => {
    azureBlobService.createBlockBlobFromLocalFile(
      container,
      blob,
      assetPath,
      (error: any) => {
        if (error != null) {
          reject(error)
        } else {
          // eslint-disable-next-line no-sync
          const stats = Fs.statSync(assetPath)
          const hash = Crypto.createHash('sha1')
          hash.setEncoding('hex')
          const input = Fs.createReadStream(assetPath)

          hash.on('finish', () => {
            resolve({
              name: assetName,
              url,
              size: stats['size'],
              sha: hash.read() as string,
            })
          })

          input.pipe(hash)
        }
      }
    )
  })
}

function getAzureBlobService(): Promise<Azure.BlobService> {
  return new Promise<Azure.BlobService>((resolve, reject) => {
    if (
      process.env.AZURE_STORAGE_ACCOUNT === undefined ||
      process.env.AZURE_STORAGE_ACCESS_KEY === undefined ||
      process.env.AZURE_BLOB_CONTAINER === undefined
    ) {
      reject('Invalid azure storage credentials')
      return
    }

    const blobService = Azure.createBlobService(
      process.env.AZURE_STORAGE_ACCOUNT,
      process.env.AZURE_STORAGE_ACCESS_KEY
    )

    blobService.createContainerIfNotExists(
      process.env.AZURE_BLOB_CONTAINER,
      {
        publicAccessLevel: 'blob',
      },
      (error: any) => {
        if (error !== null) {
          console.log(error)
          reject(
            `Unable to ensure azure blob container - ${process.env.AZURE_BLOB_CONTAINER}. Deployment aborting...`
          )
        } else {
          resolve(blobService)
        }
      }
    )
  })
}

function createSignature(body: any, secret: string) {
  const hmac = Crypto.createHmac('sha1', secret)
  hmac.update(JSON.stringify(body))
  return `sha1=${hmac.digest('hex')}`
}

function getContext() {
  return (
    process.platform +
    (distInfo.getDistArchitecture() === 'arm64' ? '-arm64' : '')
  )
}

function updateDeploy(
  artifacts: ReadonlyArray<IUploadResult>,
  secret: string
): Promise<void> {
  const { rendererSize, mainSize } = distInfo.getBundleSizes()
  const body = {
    context: getContext(),
    branch_name: platforms.getReleaseBranchName(),
    artifacts,
    stats: {
      platform: process.platform,
      rendererBundleSize: rendererSize,
      mainBundleSize: mainSize,
    },
  }
  const signature = createSignature(body, secret)
  const options = {
    method: 'POST',
    url: 'https://central.github.com/api/deploy_built',
    headers: {
      'X-Hub-Signature': signature,
    },
    json: true,
    body,
  }

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error)
        return
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(
            `Received a non-200 response (${
              response.statusCode
            }): ${JSON.stringify(body)}`
          )
        )
        return
      }

      resolve()
    })
  })
}
