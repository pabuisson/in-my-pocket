"use strict"

import Settings from "./settings"
import Logger from "./logger"
import { NotificationIds } from "./constants"

const GlobalErrorDetector = (function () {
  async function shouldAskToEnable() {
    // Early return if the error tracking has already been enabled
    await Settings.init()
    const bugReportEnabled = await Settings.get("bugReport")
    if (bugReportEnabled) return false

    // TODO: early return if the user said they didn't want to enable bug reporting

    return true
  }

  return {
    init: async () => {
      if (!window) {
        Logger.warn("(GlobalErrorDetector) Window not available in this context")
        return
      }

      if (!shouldAskToEnable()) {
        Logger.warn("(GlobalErrorDetector) The user should not be asked to enable the bug reporting")
        return
      }

      window.onerror = function () {
        const title = "In My Pocket: an error occurred"
        const message = "It's OK. If you want to help, you can enable anonymous bug reports in the settings"
        const contextMessage = "It will anonymously report errors to me, so that I can identify them more easily"

        // NOTE: a "buttons" option exists but is not implemented by Firefox/Opera/Safari
        //       I could use it for Chrome though
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/notifications/NotificationOptions
        browser.notifications.create(NotificationIds.AN_ERROR_OCCURRED, {
          type: "basic",
          // TODO: iconUrl
          title,
          message,
          contextMessage,
        })

        // NOTE: very buggy. If I don't click on the notification straight away, it looks like it has no event
        //        handling attached anymore, at least if the error is triggered from the popup
        browser.notifications.onClicked.addListener(notificationId => {
          if (notificationId == NotificationIds.AN_ERROR_OCCURRED) {
            browser.notifications.clear(notificationId)
            browser.runtime.openOptionsPage().then(() => {
              setTimeout(() => {
                const event = { action: "settings:highlight", section: "bug-report" }
                browser.runtime.sendMessage(event)
              }, 500)
            })
          }
        })

        // Store the error information (if needed?)
        // And ask the user if they want to enable bug reporting
        // If they don't: store the fact that they refused to avoid spamming them
        // NOTE: I can store either the date and say I won't ask again for x months
        //       or store the version and say I won't ask again until the next minor version

        // Prevent the default browser error handling
        return true
      }
    },
  }
})()

export default GlobalErrorDetector
