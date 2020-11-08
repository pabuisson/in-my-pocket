"use strict"

import "./popup.html"
import "./popup.scss"

import Authentication from "../modules/authentication.js"
import Badge from "../modules/badge.js"
import Logger from "../modules/logger.js"
import { PopupFlash, FlashKind } from "../modules/popup_flash.js"
import PopupMainLoader from "../modules/popup_main_loader.js"
import PopupUI from "../modules/popup_ui.js"
import { VersionManager } from "../modules/version_manager.js"
import { PocketError, PocketNotice, MouseButtons } from "../modules/constants.js"
import SentryLoader from "../modules/sentry_loader.js"

// -------------

SentryLoader.init()

// -------------

// --- EVENTS ---

// prevent general.autoScroll
document.body.onmousedown = e => {
  if (e.button === MouseButtons.MIDDLE) return false
}

// - - - MAIN LOGIC LOOP - - -

document.addEventListener("DOMContentLoaded", function () {
  // Add dedicated class to body if opened in sidebar
  if (PopupUI.inSidebar()) document.body.classList.add("sidebar")

  // Setup the UI and draw the list with items already in memory
  PopupUI.setup()

  browser.storage.local
    .get(["access_token", "lastFullSyncAtVersion"])
    .then(({ access_token, lastFullSyncAtVersion }) => {
      if (access_token && VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)) {
        PopupFlash.showNeedResyncMessage()
      }
    })

  Authentication.isAuthenticated().then(() => {
    PopupUI.drawList()
    // Enable the loading animation and try to update the list of items
    setTimeout(() => {
      PopupMainLoader.enable()
      browser.runtime.sendMessage({ action: "retrieve-items", force: false })
    }, 1000)
  })

  // Listen for message from background
  browser.runtime.onMessage.addListener(function (eventData) {
    PopupMainLoader.disable()

    if (eventData.error || eventData.notice) {
      Logger.warn("(popup onMessage) : " + eventData)

      if (eventData.error) {
        let flashMessage = "An error occurred: "
        switch (eventData.error) {
          case PocketError.UNREACHABLE:
            flashMessage += "could not reach the server"
            break
          case PocketError.UNAUTHORIZED:
            flashMessage += "unauthorized, you might need to login again"
            break
          case PocketError.PERMISSIONS:
            flashMessage += "missing permissions"
            break
          case PocketError.RATE_LIMIT:
            flashMessage += "max requests reached for this hour"
            flashMessage += ` (reset in ${eventData.resetDelay})`
            break
        }

        // Show flash message + Flash the badge if an error occured
        PopupFlash.show(flashMessage, FlashKind.ERROR, 5000)
        browser.runtime.sendMessage({ action: "flash-error" })
      } else if (eventData.notice) {
        if (eventData.notice === PocketNotice.ALREADY_IN_LIST) {
          PopupFlash.show("This page is already in your Pocket :)", FlashKind.NOTICE, 5000)
        }
      }
    } else {
      Logger.log(`(popup onMessage) : ${eventData.action}`)

      switch (eventData.action) {
        case "authenticated":
          window.location.reload() // For sidebar mode
          window.close() // For popup (but doesn't close a sidebar)
          browser.runtime.sendMessage({ action: "update-badge-count" })
          break

        case "marked-as-read":
        case "deleted":
          PopupUI.fadeOutItem(eventData.id)
          PopupUI.updateList()
          break

        case "added-item":
          PopupUI.updateList()
          break

        case "favorited":
          PopupUI.favoriteItem(eventData.id)
          break

        case "unfavorited":
          PopupUI.unfavoriteItem(eventData.id)
          break

        case "retrieved-items":
          PopupUI.updateList()
          Badge.updateCount()

          if (eventData.full) {
            if (PopupFlash.isNeedResyncMessageVisibleDisplayed()) {
              PopupFlash.show(
                "<strong>All your items have been resynced, thank you!<strong> 🤗",
                FlashKind.SUCCESS,
                5000
              )
            }
          }
          break
      }
    }
  })
})
