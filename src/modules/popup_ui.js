"use strict"

import Authentication from "../modules/authentication"
import Logger from "../modules/logger"
import PopupItemList from "../modules/popup_item_list"
import PopupMainLoader from "../modules/popup_main_loader"
import PopupPagination from "../modules/popup_pagination"
import PopupTopActions from "../modules/popup_top_actions"
import PopupTopFilter from "../modules/popup_top_filter"
import Settings from "../modules/settings"
import Utility from "../modules/utility"
import { VersionManager } from "../modules/version_manager"
import { PopupFlash } from "../modules/popup_flash"

// ----------------

const defaultDisplaySetting = { currentPage: 1, query: "" }

const PopupUI = (function () {
  const intervalWithoutOpening = 5 * 60

  function setupEventListeners() {
    PopupPagination.setupEventListeners()
    PopupTopActions.setupEventListeners()
    PopupTopFilter.setupEventListeners()
    PopupItemList.setupEventListeners()
  }

  function setZoomLevel() {
    Settings.init().then(function () {
      const zoomLevel = Settings.get("zoomLevel")
      document.documentElement.style.fontSize = zoomLevel
    })
  }

  async function setupAuthenticatedUI() {
    Logger.log("(PopupUI.setupAuthenticatedUI)")

    // User is authenticated
    document.querySelector(".authentication").classList.add("hidden")
    document.querySelector(".authenticated").classList.remove("hidden")

    // Show pagination if setting is enabled
    PopupPagination.setPaginationVisibility()

    // Set up the event listeners on the UI
    setupEventListeners()

    const { display } = await browser.storage.local.get("display")

    const currentTimestamp = (Date.now() / 1000) | 0
    const parsedDisplay = Utility.parseJson(display) || defaultDisplaySetting
    const lastDisplay = parsedDisplay.displayedAt

    const displayOptions = Object.assign({}, parsedDisplay)

    // Reset query and currentPage if more than `intervalWithoutOpening` since last opening
    if (lastDisplay && currentTimestamp - lastDisplay > intervalWithoutOpening) {
      Logger.log(`(PopupUI.setupAuthenticatedUI) time elapsed=${currentTimestamp - lastDisplay}`)
      Logger.log("(PopupUI.setupAuthenticatedUI) reset page to 1 and filter to ''")
      Object.assign(displayOptions, defaultDisplaySetting)
    }

    // Set initial filter value in the PopupUI and focus the field
    PopupTopFilter.setValue(displayOptions.query)
    PopupTopFilter.updateFavoriteFilterIcon()
    PopupTopFilter.focusSearchField()

    // Updates display.displayedAt and page + query if they have been reset
    Object.assign(displayOptions, { displayedAt: currentTimestamp })
    Logger.log(
      "(PopupUI.setupAuthenticatedUI) Save display variable to local storage: " + JSON.stringify(displayOptions),
    )
    await browser.storage.local.set({ display: JSON.stringify(displayOptions) })
    // FIXME: popupItemList and popupUI pass `display` via browser.storage, which is slow.
    PopupItemList.drawList()
  }

  function setupUnauthenticatedUI() {
    Logger.log("(PopupUI.setupUnauthenticatedUI)")

    // User is not authenticated yet
    const authenticationButton = document.querySelector(".authentication button")
    const pocketSignupLink = document.querySelector(".authentication .signup")

    document.querySelector(".authentication").classList.remove("hidden")
    document.querySelector(".authenticated").classList.add("hidden")

    authenticationButton.addEventListener("click", () => {
      window.close() // Close the popup after starting authentication
      browser.runtime.sendMessage({ action: "authenticate" })
    })

    pocketSignupLink.addEventListener("click", () => {
      setTimeout(() => {
        window.close()
      }, 200)
    })
  }

  function ensureFullResyncTriggeredIfNeeded() {
    browser.storage.local
      .get(["access_token", "lastFullSyncAtVersion"])
      .then(({ access_token, lastFullSyncAtVersion }) => {
        if (access_token && VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)) {
          PopupFlash.showNeedResyncMessage()
        }
      })
  }

  return {
    inSidebar: () => window.location.search.includes("ui=sidebar"),
    inPopup: () => window.location.search.includes("ui=popup"),

    setup: function () {
      setZoomLevel()

      Authentication.isAuthenticated().then(
        () => {
          setupAuthenticatedUI()
          ensureFullResyncTriggeredIfNeeded()

          setTimeout(() => {
            PopupMainLoader.enable()
            browser.runtime.sendMessage({ action: "retrieve-items", force: false })
          }, 1000)
        },
        () => {
          setupUnauthenticatedUI()
        },
      )
    },
  }
})()

export { defaultDisplaySetting }
export default PopupUI
