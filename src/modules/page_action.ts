"use strict"

import browser from "webextension-polyfill"
import Logger from "./logger"
import Settings from "./settings"
import Items from "./items"

const PageAction = (function () {
  function pageActionEnabled() {
    const promise = new Promise((resolve, reject) => {
      Settings.init().then(() => {
        const showPageActionSetting = Settings.get("showPageAction")
        Logger.log(`page action enabled ? ${showPageActionSetting}`)

        if (showPageActionSetting) {
          // @ts-ignore
          resolve()
        } else {
          reject()
        }
      })
    })

    return promise
  }

  return {
    redraw: function (tabId: any, url: string) {
      pageActionEnabled().then(() => {
        browser.storage.local.get("items").then(({ items }) => {
          const containsItem = Items.contains(items as string, url)

          if (containsItem) {
            PageAction.drawEnabled(tabId)
          } else {
            PageAction.drawDisabled(tabId)
          }

          PageAction.show(tabId)
        })
      })
    },

    redrawAllTabs: function () {
      pageActionEnabled().then(() => {
        browser.tabs.query({}).then(function (tabs) {
          for (const tab of tabs) {
            if (tab.url) {
              PageAction.redraw(tab.id, tab.url)
            }
          }
        })
      })
    },

    drawEnabled: function (...tabIds: any[]) {
      pageActionEnabled().then(() => {
        tabIds.forEach(tabId => {
          // NOTE: using path: "/path/to/svg" does not work properly for FF56 and older
          browser.pageAction.setIcon({
            tabId: tabId,
            path: {
              19: "assets/icons/page-action-enabled.svg",
              38: "assets/icons/page-action-enabled.svg",
            },
          })
          browser.pageAction.setTitle({ tabId: tabId, title: "Mark as read" })
        })
      })
    },

    drawDisabled: function (...tabIds: any[]) {
      pageActionEnabled().then(() => {
        tabIds.forEach(tabId => {
          // NOTE: using path: "/path/to/svg" does not work properly for FF56 and older
          browser.pageAction.setIcon({
            tabId: tabId,
            path: {
              19: "assets/icons/page-action-disabled.svg",
              38: "assets/icons/page-action-disabled.svg",
            },
          })
          browser.pageAction.setTitle({ tabId: tabId, title: "Add to pocket" })
        })
      })
    },

    // TODO: Can't I just add this in my public draw methods? so that it wouldn't be necessary
    //       to manually call this each time I draw some page actions
    show: function (tabId: any) {
      pageActionEnabled().then(() => {
        browser.pageAction.show(tabId)
      })
    },

    hideAllTabs: function () {
      browser.tabs.query({}).then(tabs => {
        for (const tab of tabs) {
          if (tab.id) browser.pageAction.hide(tab.id)
        }
      })
    },

    // FIXME: this violates SRP, should not be responsible of the PageAction visual state
    //        AND of adding/removing the item from the items list
    // FIXME: duplication with background/keyboard.js
    toggle: function (tab: any) {
      pageActionEnabled().then(() => {
        browser.storage.local.get("items").then(({ items }) => {
          const matchingItem = Items.findByUrl(items as string, tab.url)

          if (matchingItem) {
            browser.tabs.query({ active: true, currentWindow: true }).then(([currentTab]) => {
              Items.markAsRead(matchingItem.id, currentTab.id)
            })
          } else {
            Items.addItem([{ url: tab.url, title: tab.title, tabId: tab.id }])
          }
        })
      })
    },
  }
})()

export default PageAction
