import * as Sentry from "@sentry/browser"
import Settings from "../modules/settings.js"
import { VersionManager } from "../modules/version_manager.js"

const SentryLoader = (function () {
  const DEFAULT_USER_ID = "0"

  const normalizePath = path => {
    const basePath = browser.runtime.getURL("")
    return path.replace(basePath, "~/")
  }

  return {
    init: async () => {
      await Settings.init()
      const bugReportEnabled = await Settings.get("bugReport")
      const { uuid } = await browser.storage.local.get("uuid")

      Sentry.init({
        dsn: "https://ede671f16b29b8a41a80e53a86ca13c0@o4505838404698112.ingest.sentry.io/4505838405877760",
        release: "in-my-pocket@" + VersionManager.getCurrentVersion(),
        enabled: bugReportEnabled,
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
        // ----
        initialScope: {
          user: { id: uuid || DEFAULT_USER_ID },
        },
        integrations: [
          new Sentry.Integrations.GlobalHandlers({
            onerror: true,
            onunhandledrejection: false, // disable sentries for unhandled promise rejection errors
          }),
        ],
        // If returns null, nothing get sent to Sentry
        beforeSend(event) {
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
    },

    // When setting the user ID for the first time from the settings page,
    // outside the usual initialization sequence of Sentry
    setUserId: uuid => {
      Sentry.setUser({ id: uuid || DEFAULT_USER_ID })
    },
  }
})()

export default SentryLoader
