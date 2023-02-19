"use strict"

import Authentication from "../modules/authentication.js"
import Badge from "../modules/badge.js"
import ContextMenu from "../modules/context_menu.js"
import Items from "../modules/items.js"
import ItemsFetcher from "../modules/items_fetcher.js"
import Logger from "../modules/logger.js"

// - - - MESSAGES - - -

browser.runtime.onMessage.addListener(function (eventData) {
  Logger.log(`(bg.onMessage) eventData.action: ${eventData.action}`)
  switch (eventData.action) {
    case "authenticate":
      Authentication.authenticate().then(() => {
        browser.runtime.sendMessage({ action: "authenticated" })
        ItemsFetcher.retrieveItems(true)
        ContextMenu.createEntries()
      })
      break
    case "retrieve-items":
      ItemsFetcher.retrieveItems(eventData.force)
      break
    case "favorite":
      Items.favoriteItem(eventData.id)
      break
    case "unfavorite":
      Items.unfavoriteItem(eventData.id)
      break
    case "add-item":
      Items.addItem([{ url: eventData.url, title: eventData.title, tabId: eventData.tabId }])
      break
    case "mark-as-read":
      Items.markAsRead(eventData.id, eventData.tabId)
      break
    case "delete-item":
      Items.deleteItem(eventData.id, eventData.tabId)
      break
    case "update-item":
      Items.updateItem(eventData.id, eventData)
      break
    case "update-badge-count":
      Badge.updateCount()
      break
    case "read-item":
      Items.openItem(eventData.item, eventData.openInNewTab);
      break
    case "random-item":
      Items.openRandom(eventData.query)
      break
    case "flash-error":
      Badge.flashError()
      break
    default:
      Logger.log(`(bg.onMessage) Unknown action: ${eventData.action}`)
  }
})

// - - - ON LOAD - - -

Authentication.isAuthenticated().then(function () {
  ContextMenu.createEntries()
  Badge.updateCount()
})
