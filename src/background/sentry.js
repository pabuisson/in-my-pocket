import * as Sentry from "@sentry/browser"
import Settings from "../modules/settings.js"
import { VersionManager } from "../modules/version_manager.js"

// --------------------------

const normalizePath = path => {
  return path.replace(/(webpack_require__@)?(moz|chrome)-extension:\/\/[^\/]+\//, "~/")
}

Settings.init().then(() => {
  Sentry.init({
    dsn: "https://1207d464a72f4c788936641a73b872a2@o153528.ingest.sentry.io/1206746",

    // To set your release version
    release: "in-my-pocket@" + VersionManager.getCurrentVersion(),

    beforeSend(event) {
      if (!Settings.get("bugReport")) {
        return null
      }

      if (event.culprit) {
        event.culprit = normalizePath(event.culprit)
      }

      if (event.exception) {
        event.exception.values[0].stacktrace.frames = event.exception.values[0].stacktrace.frames.map(
          frame => {
            frame.filename = normalizePath(frame.filename)
            return frame
          }
        )
      }

      return event
    },
  })
})
