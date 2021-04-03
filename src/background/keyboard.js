"use strict"

import Items from "../modules/items.js"
import Logger from "../modules/logger.js"
import Settings from "../modules/settings.js"
import { KeyboardShortcuts } from "../modules/constants.js"

// ---------------

browser.commands.onCommand.addListener(command => {
  switch (command) {
    case KeyboardShortcuts.toggle:
      Logger.log("(keyboard) KeyboardShortcuts.toggle")
      browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
        // FIXME: duplication with PageAction.toggle())
        browser.storage.local.get("items").then(({ items }) => {
          const matchingItem = Items.find(items, { url: currentTab.url })

          if (matchingItem) {
            browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
              Items.markAsRead(matchingItem.id, currentTab.id)
            })
          } else {
            Items.addItem([{ url: currentTab.url, title: currentTab.title, tabId: currentTab.id }])
          }
        })
      })
      break
    case KeyboardShortcuts.openFirstItem:
      Logger.log("(keyboard) KeyboardShortcuts.openFirstItem")
      Items.openFirst()
      break
    case KeyboardShortcuts.openRandomItem:
      Logger.log("(keyboard) KeyboardShortcuts.openRandomItem")
      Items.openRandom()
      break
  }
})
