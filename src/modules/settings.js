"use strict"

import Utility from "./utility"

// --------------------------

const Settings = (function () {
  let settings = {}
  const defaultSettings = {
    debugMode: false,
    bugReport: false,
    openInNewTab: true,
    perPage: "50",
    showBadge: true,
    showPageAction: true,
    zoomLevel: "12px",
    // Automations
    archiveWhenOpened: false,
    closeTabWhenAdded: false,
    closeTabWhenRead: false,
  }

  async function load() {
    const data = await browser.storage.local.get("settings")

    settings = Object.assign(settings, defaultSettings)
    if (data && data.settings) {
      settings = Object.assign(settings, Utility.parseJson(data.settings) || {})
    }
  }

  return {
    // TODO: add a "cache: true|false" param, that _could_ be useful on some pages (typically, settings page)
    // to avoid reaching for localStorage too often. This is a very low prio thing though, as the settings page
    // is not used in the day-to-day and seems to be working fine
    init: function () {
      return load()
    },

    get: function (key) {
      if (key) {
        return settings[key]
      } else {
        return settings
      }
    },

    set: function (key, value) {
      settings[key] = value
      return true
    },

    save: function () {
      browser.storage.local.set({ settings: JSON.stringify(settings) })
      return true
    },
  }
})()

export default Settings
