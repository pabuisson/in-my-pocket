import * as Sentry from "@sentry/browser"
import Settings from "../modules/settings.js"
import { VersionManager } from "../modules/version_manager.js"

const SentryLoader = function () {
  const normalizePath = path => {
    const basePath = browser.runtime.getURL("")
    return path.replace(basePath, "~/")
  }

  return {
    init: () => {
      Settings.init().then(() => {
        Sentry.init({
          dsn: "https://1207d464a72f4c788936641a73b872a2@o153528.ingest.sentry.io/1206746",
          release: "in-my-pocket@" + VersionManager.getCurrentVersion(),

          // If returns null, nothing get sent to Sentry
          beforeSend(event) {
            if (!Settings.get("bugReport")) {
              return null
            }

            if (event.request && event.request.url) {
              event.request.url = normalizePath(event.request.url)
            }
            if (event.exception) {
              event.exception.values.forEach(exception => {
                if (exception.stacktrace && exception.stacktrace.frames) {
                  exception.stacktrace.frames.forEach(frame => {
                    frame.filename = normalizePath(frame.filename)
                  })
                }
              })
            }

            return event
          },
        })
      })
    },
  }
}

export default SentryLoader
