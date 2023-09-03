"use strict"

import "./options.html"
import "./options.scss"

import Authentication from "../modules/authentication"
import Badge from "../modules/badge"
import Logger from "../modules/logger"
import BrowserDetector from "../modules/browser_detector"
import ContextMenu from "../modules/context_menu"
import FeatureSwitches from "../modules/feature_switches"
import PageAction from "../modules/page_action"
import Settings from "../modules/settings"
import SentryLoader from "../modules/sentry_loader"
import GlobalErrorDetector from "../modules/global_error_detector"
import { parseIntBase } from "../modules/constants"

// -------------

SentryLoader.init()
GlobalErrorDetector.init()

// -------------

const disconnectRow = document.querySelector(".disconnect-row")
const disconnectStep2 = document.querySelector(".disconnect-second-step")
const disconnectActionStep1 = document.querySelector(".disconnect-first-step")
const disconnectActionStep2Confirm = document.querySelector(".disconnect-second-step-confirm")
const disconnectActionStep2Cancel = document.querySelector(".disconnect-second-step-cancel")
const displayBadgeCountCheckbox = document.querySelector(".display-badge-count")
const displayPageActionCheckbox = document.querySelector(".display-page-action")
const enableDebugModeCheckbox = document.querySelector(".enable-debug-mode")
const enableBugReportCheckbox = document.querySelector(".enable-bug-report")
const openInNewTabCheckbox = document.querySelector(".open-in-new-tab")
const paginationPerPageSelector = document.querySelector(".pagination-per-page")
const zoomLevelSelector = document.querySelector(".zoom-level")
const archiveWhenOpenedCheckbox = document.querySelector(".archive-when-opened")
const closeTabWhenAddedCheckbox = document.querySelector(".close-tab-when-added")
const closeTabWhenReadCheckbox = document.querySelector(".close-tab-when-read")
const chromeShortcutsPageLink = document.querySelector(".chrome-shortcuts-page")

const savedNotificationElement = document.querySelector(".saved-notification")

const UI = (function () {
  let savedNotificationTimerId = null

  function unhighlightContainer(containerRow) {
    containerRow.classList.remove("highlight")
  }

  function flashSavedNotification(containerRow) {
    savedNotificationElement.classList.remove("hidden")

    if (containerRow) {
      const topMarginInPx = 2
      const offsetTop = parseInt(containerRow.offsetTop, parseIntBase) + topMarginInPx
      savedNotificationElement.style.top = `${offsetTop}px`
    } else {
      savedNotificationElement.style.top = "0px"
    }

    if (savedNotificationTimerId) {
      clearTimeout(savedNotificationTimerId)
    }

    savedNotificationTimerId = setTimeout(() => {
      savedNotificationElement.classList.add("hidden")
    }, 2000)
  }

  async function initializeUIFromSettings() {
    // If user is not connected, hide the "disconnect" link
    Authentication.isAuthenticated().catch(function () {
      disconnectRow.style.display = "none"
    })

    // Initialize the state of all UI elements
    Settings.init().then(function () {
      const settings = Settings.get()

      displayBadgeCountCheckbox.checked = settings["showBadge"]
      displayPageActionCheckbox.checked = settings["showPageAction"]
      enableDebugModeCheckbox.checked = settings["debugMode"]
      enableBugReportCheckbox.checked = settings["bugReport"]
      openInNewTabCheckbox.checked = settings["openInNewTab"]
      archiveWhenOpenedCheckbox.checked = settings["archiveWhenOpened"]
      closeTabWhenAddedCheckbox.checked = settings["closeTabWhenAdded"]
      closeTabWhenReadCheckbox.checked = settings["closeTabWhenRead"]
      paginationPerPageSelector.value = settings["perPage"] || ""
      zoomLevelSelector.value = settings["zoomLevel"]
    })

    // Displays the proper message for addon keyboard shortcuts
    if ((await BrowserDetector.browserName()) === "Firefox") {
      document.querySelector(".keyboard .chrome").style.display = "none"
    } else {
      document.querySelector(".keyboard .firefox").style.display = "none"
    }

    const fsContainer = document.querySelector(".enabled-feature-switches-row")
    const enabledFeatureSwitches = Object.keys(FeatureSwitches)
      .map(key => (FeatureSwitches[key] ? key : null))
      .filter(Boolean)
      .join(", ")

    if (enabledFeatureSwitches.length == 0) {
      // Really remove from the DOM, otherwise a visible border-bottom remains
      fsContainer.parentNode.removeChild(fsContainer)
    } else {
      fsContainer.classList.remove("hidden")
      fsContainer.querySelector(".value").appendChild(document.createTextNode(enabledFeatureSwitches))
    }
  }

  return {
    setup: async function () {
      initializeUIFromSettings()

      // Event: "Display count badge" checkbox
      displayBadgeCountCheckbox.addEventListener("change", function () {
        Settings.set("showBadge", this.checked)
        Settings.save()
        Badge.updateCount()
        flashSavedNotification(this.parentNode)
      })

      // Event: "Display add-to-pocket icon in address bar" checkbox
      displayPageActionCheckbox.addEventListener("change", function () {
        Settings.set("showPageAction", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)

        if (this.checked) {
          PageAction.redrawAllTabs()
        } else {
          PageAction.hideAllTabs()
        }
      })

      // Event: "Open in new tab" checkbox
      openInNewTabCheckbox.addEventListener("change", function () {
        Settings.set("openInNewTab", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      // Event: "Enable debug mode" checkbox
      enableDebugModeCheckbox.addEventListener("change", function () {
        Settings.set("debugMode", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      // Event: "Enable bug reoprt" checkbox
      enableBugReportCheckbox.addEventListener("change", async function () {
        Settings.set("bugReport", this.checked)
        Settings.save()

        // Generate a UUID that will be used to anonymously differentiate users
        // the first time they enable error reporting
        const { uuid: currentUuid } = await browser.storage.local.get("uuid")
        if (this.checked && !currentUuid) {
          const uuid = self.crypto.randomUUID()
          await browser.storage.local.set({ uuid: uuid })
          SentryLoader.setUserId(uuid)
        }

        unhighlightContainer(this.parentNode) // This is the only row that can be highlighted
        flashSavedNotification(this.parentNode)
      })

      // Event: "Automation: archive when opened" checkbox
      archiveWhenOpenedCheckbox.addEventListener("change", function () {
        Settings.set("archiveWhenOpened", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      // Event: "Automation: close tab when added" checkbox
      closeTabWhenAddedCheckbox.addEventListener("change", function () {
        Settings.set("closeTabWhenAdded", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      // Event: "Automation: close tab when read" checkbox
      closeTabWhenReadCheckbox.addEventListener("change", function () {
        Settings.set("closeTabWhenRead", this.checked)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      paginationPerPageSelector.addEventListener("change", function () {
        Settings.set("perPage", parseInt(this.value, parseIntBase) || null)
        Settings.save()

        // Reset the display options (no need to read it from local storage
        // since we just reset it)
        const displayOptions = { currentPage: 1, displayedAt: null }
        browser.storage.local.set({ display: JSON.stringify(displayOptions) })

        flashSavedNotification(this.parentNode)
      })

      // Event: "Zoom level" selector
      zoomLevelSelector.addEventListener("change", function () {
        Settings.set("zoomLevel", this.value)
        Settings.save()
        flashSavedNotification(this.parentNode)
      })

      // Event: click on "chrome addon shortcuts" link
      if ((await BrowserDetector.browserName()) !== "Firefox") {
        chromeShortcutsPageLink.addEventListener("click", function (ev) {
          ev.preventDefault()
          browser.tabs.update({ url: "chrome://extensions/shortcuts" })
        })
      }

      // Event : "Disconnect" from the Pocket account click
      disconnectActionStep1.addEventListener("click", function (ev) {
        ev.preventDefault()
        disconnectStep2.classList.remove("hidden")
      })

      disconnectActionStep2Cancel.addEventListener("click", function (ev) {
        ev.preventDefault()
        disconnectStep2.classList.add("hidden")
      })

      disconnectActionStep2Confirm.addEventListener("click", function (ev) {
        ev.preventDefault()
        browser.storage.local.get().then(data => {
          const keysToPersist = ["settings"]
          const keysToRemove = Object.keys(data).filter(key => {
            // Filter out keys listed in keysToPersist, and keeps
            // all the other storage keys -> those will be removed
            return keysToPersist.indexOf(key) < 0
          })

          browser.storage.local.remove(keysToRemove)

          // Remove the badge, destroy all right-click entries, and hides pageActions
          Badge.hide()
          ContextMenu.destroyEntries()
          PageAction.hideAllTabs()

          disconnectRow.classList.add("hidden")
        })
      })
    },
  }
})()

// ---------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  UI.setup()

  browser.runtime.onMessage.addListener(function (eventData) {
    if (eventData.action !== "settings:highlight") return

    const { section } = eventData
    switch (section) {
      case "bug-report": {
        const itemToHighlight = document.querySelector(".enable-bug-report-row")
        if (itemToHighlight) {
          itemToHighlight.classList.add("highlight")
        } else {
          Logger.error(`Could not find the section '${section}' that should be highlighted`)
        }
        break
      }
    }
  })
})
