"use strict"

import * as Sentry from "@sentry/browser"
import Settings from "./settings.js"

// ---------------

const BugReporter = (function () {
  return {
    captureException: function (error, extraData = {}) {
      Settings.init().then(() => {
        if (Settings.get("bugReport")) {
          Sentry.captureException(error, { extra: extraData })
        }
      })
    },
  }
})()

export default BugReporter
