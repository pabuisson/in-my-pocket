"use strict"

import Utility from "./utility.js"

// --------------------------

const Settings = (function () {
  let _loaded = false
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
    if (_loaded) return;
    const data = await browser.storage.local.get("settings");
    _loaded = true

    settings = Object.assign(settings, defaultSettings)
    if (data && data.settings) {
      settings = Object.assign(settings, Utility.parseJson(data.settings) || {})
    }
  }

  return {
    init: function () {
      return load()
    },

    get: function (key) {
      if (_loaded) {
        if (key) {
          return settings[key]
        } else {
          return settings
        }
      }

      return undefined
    },

    set: function (key, value) {
      if (_loaded) {
        settings[key] = value
        return true
      }

      return false
    },

    save: function () {
      // If settings not yet loaded, we don't need to save them (they can't have
      // been modified since they've not even been loaded
      if (_loaded) {
        browser.storage.local.set({ settings: JSON.stringify(settings) })
        return true
      }

      return false
    },
  }
})()

export default Settings
