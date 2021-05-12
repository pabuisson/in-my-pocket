"use strict"

import Settings from "./settings.js"

// Info and warning are only displayed if debug mode is enabled
// Errors on the other hand are *ALWAYS* displayed in the browser console
const Logger = (function () {
  const prefix = "IMP | "

  function isLoggingEnabled() {
    return Settings.init().then(function () {
      const isDebugModeEnabled = Settings.get("debugMode")

      if (isDebugModeEnabled === true) {
        return isDebugModeEnabled
      } else {
        return Promise.reject()
      }
    })
  }

  return {
    log: async function (message) {
      if (await isLoggingEnabled()) {
        console.log(prefix + message)
      }
    },
    warn: async function (message) {
      if (await isLoggingEnabled()) {
        console.warn(prefix + message)
      }
    },
    error: function (message) {
      console.error(prefix + message)
    },
  }
})()

export default Logger
