"use strict"

// @ts-ignore
import * as Sentry from "@sentry/browser"
import Settings from "./settings"

// ---------------

const BugReporter = (function () {
  return {
    captureException: function (error: any, extraData = {}, tags = {}) {
      Settings.init().then(() => {
        if (Settings.get("bugReport")) {
          Sentry.captureException(error, { extra: extraData, tags: tags })
        }
      })
    },
    captureMessage: function (message: string, extraData = {}, tags = {}) {
      Settings.init().then(() => {
        if (Settings.get("bugReport")) {
          Sentry.captureMessage(message, { extra: extraData, tags: tags })
        }
      })
    },
  }
})()

export default BugReporter
