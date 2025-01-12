"use strict"

import Badge from "../modules/badge"
import BugReporter from "../modules/bug_reporter"
import Logger from "../modules/logger"
import PopupItemList from "../modules/popup_item_list"
import PopupMainLoader from "../modules/popup_main_loader"
import PopupUI from "../modules/popup_ui"
import SentryLoader from "../modules/sentry_loader"
import { PocketError, PocketNotice, MouseButtons } from "../modules/constants"
import { PopupFlash, FlashKind } from "../modules/popup_flash"

// -------------

SentryLoader.init()

// --- EVENTS ---

function onMessage(eventData) {
  Logger.log(`(popup onMessage): ${eventData.action}`)

  switch (eventData.action) {
    case "authenticated":
      window.location.reload() // For sidebar mode
      browser.runtime.sendMessage({ action: "update-badge-count" })
      break

    case "marked-as-read":
    case "deleted":
      PopupItemList.fadeOutItem(eventData.id)
      PopupItemList.updateList()
      break

    case "added-item":
      PopupItemList.updateList()
      break

    case "favorited":
      PopupItemList.favoriteItem(eventData.id)
      break

    case "unfavorited":
      PopupItemList.unfavoriteItem(eventData.id)
      break

    case "retrieved-items":
      PopupItemList.updateList()
      Badge.updateCount()

      if (eventData.full) {
        if (PopupFlash.isNeedResyncMessageDisplayed()) {
          PopupFlash.show("<strong>All your items have been resynced, thank you!<strong> 🤗", FlashKind.SUCCESS, 5000)
        }
      }
      break
  }
}

function onError(eventData) {
  Logger.warn(`(popup onError): ${eventData}`)

  let flashMessage = "An error occurred: "
  switch (eventData.error) {
    case PocketError.UNAUTHORIZED:
      flashMessage += "unauthorized, you might need to login again"
      break
    case PocketError.RATE_LIMIT:
      flashMessage += "max requests reached for this hour"
      flashMessage += ` (reset in ${eventData.resetDelay})`
      break
    case PocketError.PERMISSIONS:
      flashMessage += "missing permissions"
      break
    case PocketError.NOT_FOUND:
      flashMessage += "target URL does not exist"
      break
    case PocketError.TIMEOUT:
      flashMessage += "timed out while contacting Pocket API"
      break
    case PocketError.UNKNOWN:
      flashMessage += "unhandled HTTP response"
      break
    case PocketError.GENERIC:
      flashMessage += "something went wrong that does not fit any known case"
      break
  }

  // Show flash message + flash the badge if an error occured
  PopupFlash.show(flashMessage, FlashKind.ERROR, 5000)
  browser.runtime.sendMessage({ action: "flash-error" })

  // TODO: BugReporter is already called from Request. Is this useful at all?
  BugReporter.captureException({ error: eventData.error })
}

function onNotice(eventData) {
  Logger.warn(`(popup onNotice) : ${eventData}`)

  if (eventData.notice === PocketNotice.ALREADY_IN_LIST) {
    PopupFlash.show("This page is already in your Pocket :)", FlashKind.NOTICE, 5000)
  }
}

// prevent general.autoScroll
document.body.onmousedown = e => {
  if (e.button === MouseButtons.MIDDLE) return false
}

// - - - MAIN LOGIC LOOP - - -

document.addEventListener("DOMContentLoaded", function () {
  // Add dedicated class to body if opened in sidebar
  if (PopupUI.inSidebar()) {
    document.body.classList.add("sidebar")
    document.documentElement.classList.add("sidebar")
  }

  // Setup the UI and draw the list with items already in memory
  PopupUI.setup()

  // Listen for message from background
  browser.runtime.onMessage.addListener(function (eventData) {
    PopupMainLoader.disable()
    if (eventData.error) {
      onError(eventData)
    } else if (eventData.notice) {
      onNotice(eventData)
    } else {
      onMessage(eventData)
    }
  })
})
