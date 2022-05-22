import { app, net } from 'electron'
import { getArchitecture } from '../lib/get-architecture'
import { getMainGUID } from '../lib/get-main-guid'

const ErrorEndpoint = 'https://central.github.com/api/desktop/exception'
const NonFatalErrorEndpoint =
  'https://central.github.com/api/desktop-non-fatal/exception'

let hasSentFatalError = false

/** Report the error to Central. */
export async function reportError(
  error: Error,
  extra?: { [key: string]: string },
  nonFatal?: boolean
) {
  if (__DEV__) {
    return
  }

  // We never want to send more than one fatal error (i.e. crash) per
  // application session. This guards against us ending up in a feedback loop
  // where the act of reporting a crash triggers another unhandled exception
  // which causes us to report a crash and so on and so forth.
  if (nonFatal !== true) {
    if (hasSentFatalError) {
      return
    }
    hasSentFatalError = true
  }

  const data = new Map<string, string>()

  data.set('name', error.name)
  data.set('message', error.message)

  if (error.stack) {
    data.set('stack', error.stack)
  }

  data.set('platform', process.platform)
  data.set('architecture', getArchitecture(app))
  data.set('sha', __SHA__)
  data.set('version', app.getVersion())
  data.set('guid', await getMainGUID())

  if (extra) {
    for (const key of Object.keys(extra)) {
      data.set(key, extra[key])
    }
  }

  const body = [...data.entries()]
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&')

  try {
    await new Promise<void>((resolve, reject) => {
      const url = nonFatal ? NonFatalErrorEndpoint : ErrorEndpoint
      const request = net.request({ method: 'POST', url })

      request.setHeader('Content-Type', 'application/x-www-form-urlencoded')

      request.on('response', response => {
        if (response.statusCode === 200) {
          resolve()
        } else {
          reject(
            `Got ${response.statusCode} - ${response.statusMessage} from central`
          )
        }
      })

      request.on('error', reject)

      request.end(body)
    })
    log.info('Error report submitted')
  } catch (e) {
    log.error('Failed submitting error report', error)
  }
}
