"use strict"

import Items from "../modules/items"
import Logger from "../modules/logger"
import { KeyboardShortcuts } from "../shared/types/index"

// ---------------

browser.commands.onCommand.addListener(command => {
  switch (command) {
    case KeyboardShortcuts.toggle:
      Logger.log("(keyboard) KeyboardShortcuts.toggle")
      // FIXME: deduplicate get current tab logic
      browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
        // FIXME: duplication with PageAction.toggle())
        browser.storage.local.get("items").then(({ items }) => {
          const matchingItem = Items.findByUrl(items, currentTab.url)
          if (matchingItem) {
            browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
              Items.markAsRead(matchingItem.id, currentTab.id)
            })
          } else {
            Items.addItem([
              {
                url: currentTab.url,
                title: currentTab.title,
                tabId: currentTab.id,
              },
            ])
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
