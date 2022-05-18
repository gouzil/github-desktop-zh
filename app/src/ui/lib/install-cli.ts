import * as Path from 'path'

import * as fsAdmin from 'fs-admin'
import { mkdir, readlink, symlink, unlink } from 'fs/promises'

/** The path for the installed command line tool. */
export const InstalledCLIPath = '/usr/local/bin/github'

/** The path to the packaged CLI. */
const PackagedPath = Path.resolve(__dirname, 'static', 'github.sh')

/** Install the command line tool on macOS. */
export async function installCLI(): Promise<void> {
  const installedPath = await getResolvedInstallPath()
  if (installedPath === PackagedPath) {
    return
  }

  try {
    await symlinkCLI(false)
  } catch (e) {
    // If we error without running as an admin, try again as an admin.
    await symlinkCLI(true)
  }
}

async function getResolvedInstallPath(): Promise<string | null> {
  try {
    return await readlink(InstalledCLIPath)
  } catch {
    return null
  }
}

function removeExistingSymlink(asAdmin: boolean) {
  if (!asAdmin) {
    return unlink(InstalledCLIPath)
  }

  return new Promise<void>((resolve, reject) => {
    fsAdmin.unlink(InstalledCLIPath, error => {
      if (error !== null) {
        reject(
          new Error(
            `Failed to remove file at ${InstalledCLIPath}. Authorization of GitHub Desktop Helper is required.`
          )
        )
        return
      }

      resolve()
    })
  })
}

function createDirectories(asAdmin: boolean) {
  const path = Path.dirname(InstalledCLIPath)

  if (!asAdmin) {
    return mkdir(path, { recursive: true })
  }

  return new Promise<void>((resolve, reject) => {
    fsAdmin.makeTree(path, error => {
      if (error !== null) {
        reject(
          new Error(
            `Failed to create intermediate directories to ${InstalledCLIPath}`
          )
        )
        return
      }

      resolve()
    })
  })
}

function createNewSymlink(asAdmin: boolean) {
  if (!asAdmin) {
    return symlink(PackagedPath, InstalledCLIPath)
  }

  return new Promise<void>((resolve, reject) => {
    fsAdmin.symlink(PackagedPath, InstalledCLIPath, error => {
      if (error !== null) {
        reject(
          new Error(`Failed to symlink ${PackagedPath} to ${InstalledCLIPath}`)
        )
        return
      }

      resolve()
    })
  })
}

async function symlinkCLI(asAdmin: boolean): Promise<void> {
  await removeExistingSymlink(asAdmin)
  await createDirectories(asAdmin)
  await createNewSymlink(asAdmin)
}
