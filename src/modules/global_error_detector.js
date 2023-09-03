"use strict"

import Settings from "./settings"
import Logger from "./logger"
import { NotificationIds } from "./constants"

// TODO: don't store a unique object, but use "namespaced" keys such as errors:countByDay, errors:lastNotifiedOn
// TODO: cleanup local storage errors data when the bug report is enabled (or next time it passes in onError
//        with bug report enabled)
const GlobalErrorDetector = (function () {
  async function alreadyEnabledBugReporting() {
    await Settings.init()
    const bugReportEnabled = await Settings.get("bugReport")

    return bugReportEnabled
  }

  async function incrementTodaysErrorCount() {
    const today = new Date()
    const todayIso = today.toISOString().slice(0, 10)

    const { GlobalErrorDetector: errorData = { countByDay: {}, lastNotifiedOn: null } } =
      await browser.storage.local.get("GlobalErrorDetector")

    if (!errorData.countByDay[todayIso]) {
      errorData.countByDay[todayIso] = 1
    } else {
      errorData.countByDay[todayIso] += 1
    }

    // TODO: clean up items older than the max days to consider

    await browser.storage.local.set({ GlobalErrorDetector: errorData })

    return
  }

  const ERRORS_COUNT_AFTER_WHICH_NOTIFY = 10

  // - no "previous notification at" & count >= 10
  // - TODO: previous notification at > 3.months.ago & count >= 100
  async function shouldNotify() {
    const {
      GlobalErrorDetector: { countByDay, lastNotifiedOn },
    } = await browser.storage.local.get("GlobalErrorDetector")

    const relevantErrorsCount = Object.keys(countByDay).reduce((total, isoDateKey) => total + countByDay[isoDateKey], 0)
    console.log({ relevantErrorsCount })
    return !lastNotifiedOn && relevantErrorsCount > ERRORS_COUNT_AFTER_WHICH_NOTIFY
  }

  async function updateLastNotifiedOn() {
    const { GlobalErrorDetector } = await browser.storage.local.get("GlobalErrorDetector")
    GlobalErrorDetector.lastNotifiedOn = new Date().toISOString().slice(0, 10)

    browser.storage.local.set({ GlobalErrorDetector })
  }

  // FIXME: very buggy. If I don't click on the notification straight away, it looks like it has no event
  //        handling attached anymore, at least if the error is triggered from the popup
  function notify() {
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
  }

  return {
    init: async () => {
      if (!window) {
        Logger.warn("(GlobalErrorDetector) window is not available in the current context")
        return
      }

      if (await alreadyEnabledBugReporting()) {
        Logger.log("(GlobalErrorDetector) The user already enabled error reporting")
        return
      }

      window.onerror = async function () {
        console.error("CAUTH AN ERROR")
        await incrementTodaysErrorCount()

        if (await shouldNotify()) {
          updateLastNotifiedOn()
          notify()
        }

        // Prevent the default browser error handling
        return true
      }

      Logger.log("(GlobalErrorDetector) onerror event listener has been setup!")
    },
  }
})()

export default GlobalErrorDetector
