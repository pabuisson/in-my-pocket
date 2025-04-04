"use strict"

import Authentication from "../modules/authentication"
import Items from "../modules/items"
import Logger from "../modules/logger"
import PageAction from "../modules/page_action"

// ---------------

browser.pageAction.onClicked.addListener(tab => {
  PageAction.toggle(tab)
})

// - - -  PAGE ACTION UPDATES - - -

// 1. When current tab url is changing
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.hasOwnProperty("url") === false) return

  Authentication.isAuthenticated()
    .then(() => {
      browser.tabs
        .get(tabId)
        .then(tab => {
          if (tab.active) {
            browser.storage.local.get("items").then(({ items }) => {
              const containsItem = Items.contains(items, tab.url)
              if (containsItem) {
                Logger.log(`(pageAction.tabsOnUpdated) loading ${tab.url} that IS in my list`)
                PageAction.drawEnabled(tabId)
                PageAction.show(tabId)
              } else {
                Logger.log(`(pageAction.tabsOnUpdated) loading ${tab.url}, NOT in my list yet`)
                PageAction.drawDisabled(tabId)
                PageAction.show(tabId)
              }
            })
          }
        })
        .catch(error => Logger.warn(`(pageAction.tabsOnUpdated) ${error}`))
    })
    .catch(() => {
      Logger.log("(pageAction.tabsOnActivated) User not authenticated, no need to update pageAction")
    })
})

// 2. When I switch to another tab, check if I need to update the state of page action
browser.tabs.onActivated.addListener(({ tabId }) => {
  Authentication.isAuthenticated()
    .then(() => {
      browser.tabs
        .get(tabId)
        .then(tab => tab.url)
        .then(currentUrl => {
          browser.storage.local.get("items").then(({ items }) => {
            const containsItem = Items.contains(items, currentUrl)
            if (containsItem) {
              Logger.log(`(pageAction.tabsOnActivated) switch to tab ${currentUrl} that IS in my list`)
              PageAction.drawEnabled(tabId)
            } else {
              Logger.log(`(pageAction.tabsOnActivated) switch to tab ${currentUrl}, NOT in my list`)
              PageAction.drawDisabled(tabId)
            }

            PageAction.show(tabId)
          })
        })
        .catch(error => Logger.warn(`(pageAction.tabsOnActivated) ${error}`))
    })
    .catch(() => {
      Logger.log("(pageAction.tabsOnActivated) User not authenticated, no need to update pageAction")
    })
})
