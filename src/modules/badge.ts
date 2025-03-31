"use strict"

import browser from "webextension-polyfill"
import Logger from "./logger"
import Settings from "./settings"
import Utility from "./utility"
import Environment from "./environment"

const Badge = (function () {
  const defaultBackgroundColor = Environment.isDevelopment() ? Environment.DEV_MODE_COLOR : "#333"
  const successBackgroundColor = "#12bc00" // ff-green-60
  const errorBackgroundColor = "#ff0039" // ff-red-50
  const spinnerChars = "⌟⌞⌜⌝"
  let spinnerCurrentChar: string | null
  let spinnerIntervalID: NodeJS.Timeout | null

  function itemsNumbers(items: any): string {
    if (items && Object.keys(items).length > 0) {
      return Object.keys(items).length.toString()
    } else {
      return ""
    }
  }

  function stopLoadingSpinner() {
    Logger.log("(stopLoadingSpinner)")

    if (spinnerIntervalID) {
      clearInterval(spinnerIntervalID)
      spinnerIntervalID = null
    }
  }

  function getNextSpinnerChar() {
    const nextCharIndex =
      // @ts-ignore
      (spinnerChars.indexOf(spinnerCurrentChar) + 1) % spinnerChars.length
    const nextSpinnerChar = spinnerChars[nextCharIndex]
    return nextSpinnerChar
  }

  return {
    hide: function () {
      browser.browserAction.setBadgeText({ text: "" })
    },

    updateCount: function (items?: any): Promise<void> {
      return new Promise(resolve => {
        stopLoadingSpinner()
        Settings.init().then(function () {
          const showBadge = Settings.get("showBadge")

          if (showBadge === true) {
            browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor })

            if (items) {
              const itemsCount = itemsNumbers(items)
              browser.browserAction.setBadgeText({
                text: itemsCount.toString(),
              })
              resolve()
            } else {
              browser.storage.local.get("items").then(({ items }) => {
                // @ts-ignore
                const itemsCollection = Utility.parseJson(items) || []
                const itemsCount = itemsNumbers(itemsCollection)
                browser.browserAction.setBadgeText({
                  text: itemsCount.toString(),
                })
                resolve()
              })
            }
          } else {
            Badge.hide()
            resolve()
          }
        })
      })
    },

    startLoadingSpinner: function () {
      if (!spinnerIntervalID) {
        Logger.log("(startLoadingSpinner) will start the spinner now")
        spinnerIntervalID = setInterval(() => {
          spinnerCurrentChar = getNextSpinnerChar()
          browser.browserAction.setBadgeText({ text: spinnerCurrentChar })
        }, 150)
      }
    },

    flashSuccess: function (): Promise<void> {
      return new Promise(resolve => {
        setTimeout(() => {
          stopLoadingSpinner()

          browser.browserAction.setBadgeText({ text: "✓" })
          browser.browserAction.setBadgeBackgroundColor({
            color: successBackgroundColor,
          })

          setTimeout(Badge.updateCount, 1500)
          resolve()
        }, 1000)
      })
    },

    flashError: function (): Promise<void> {
      return new Promise(resolve => {
        setTimeout(() => {
          stopLoadingSpinner()

          browser.browserAction.setBadgeText({ text: "!" })
          browser.browserAction.setBadgeBackgroundColor({
            color: errorBackgroundColor,
          })

          setTimeout(Badge.updateCount, 1500)
          resolve()
        }, 1000)
      })
    },
  }
})()

export default Badge
