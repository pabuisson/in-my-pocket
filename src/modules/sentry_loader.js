import * as Sentry from "@sentry/browser"
import { Integrations } from "@sentry/tracing"
import Settings from "../modules/settings"
import Logger from "../modules/logger"
import { VersionManager } from "../modules/version_manager"

const SentryLoader = (function () {
  const DEFAULT_USER_ID = "0"

  const normalizePath = path => {
    const basePath = browser.runtime.getURL("")
    return path.replace(basePath, "~/")
  }

  const generateAndPersistUUID = async () => {
    const uuid = self.crypto.randomUUID()

    // No need to await for the storage to be done
    browser.storage.local.set({ uuid: uuid }).then(() => {
      Logger.log(`(SentryLoader.generateAndPersistUUID) New UUID generated and stored: ${uuid}`)
    })

    return uuid
  }

  const getUUID = async () => {
    const { uuid: storedUuid } = await browser.storage.local.get("uuid")
    return storedUuid || generateAndPersistUUID()
  }

  return {
    init: async () => {
      await Settings.init()
      const bugReportEnabled = await Settings.get("bugReport")
      const uuid = await getUUID()

      Sentry.init({
        dsn: "https://a6dcb8356fb92f218b162b76ddc60a5e@o4507282894487552.ingest.de.sentry.io/4507282896519248",
        release: "in-my-pocket@" + VersionManager.getCurrentVersion(),
        enabled: bugReportEnabled,
        tracesSampleRate: 1.0, // For performance monitoring
        initialScope: {
          user: { id: uuid || DEFAULT_USER_ID },
        },
        integrations: [
          new Integrations.BrowserTracing({
            tracingOrigins: [
              /^https:\/\/getpocket.com\/v3\/\w+$/,
              //tracingOrigins: [
              //  "https://getpocket.com/v3/add",
              //  "https://getpocket.com/v3/get",
              //  "https://getpocket.com/v3/send",
            ],
          }),
          new Sentry.Integrations.GlobalHandlers({ onerror: true }),
        ],
        // NOTE: if beforeSend returns null, nothing get sent to Sentry
        beforeSend(event) {
          if (event.request && event.request.url) {
            event.request.url = normalizePath(event.request.url)
          }

          if (event.exception) {
            for (const exception of event.exception.values) {
              if (exception.stacktrace && exception.stacktrace.frames) {
                for (const frame of exception.stacktrace.frames) {
                  frame.filename = normalizePath(frame.filename)
                }
              }
            }
          }

          return event
        },
      })

      const int = Sentry.getCurrentHub().getClient()?.getIntegration(Integrations.BrowserTracing)
      console.log("🙏 tracingOrigins:", int.options.tracingOrigins)
      console.log("🙏 shouldCreateSpanForRequest: ", int.option.shouldCreateSpanForRequest)
      console.log("🙏 traceFetch:", int.options.traceFetch, "traceXHR: ", int.options.traceXHR)
    },
  }
})()

export default SentryLoader
