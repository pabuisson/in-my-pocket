"use strict"

import * as Sentry from "@sentry/browser"
import Settings from "./settings.js"

// ---------------

const BugReporter = (function () {
  return {
    captureException: function (error, extraData = {}, tags = {}) {
      Settings.init().then(() => {
        if (Settings.get("bugReport")) {
          Sentry.captureException(error, { extra: extraData, tags: tags })
        }
      })
    },
    captureMessage: function (message, extraData = {}, tags = {}) {
      Settings.init().then(() => {
        if (Settings.get("bugReport")) {
          Sentry.captureMessage(message, { extra: extraData, tags: tags })
        }
      })
    },
  }
})()

export default BugReporter
