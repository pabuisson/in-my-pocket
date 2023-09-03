"use strict"

import ItemsFetcher from "../modules/items_fetcher"
import Logger from "../modules/logger"
import { VersionManager } from "../modules/version_manager"
import { NotificationIds } from "../modules/constants"

browser.runtime.onInstalled.addListener(details => {
  if (details.reason === "install") {
    Logger.log("Fresh install! Welcome on board :)")
    browser.notifications.create(NotificationIds.ADDON_INSTALLED, {
      type: "basic",
      title: "Yay, welcome to In My Pocket 🎉",
      message: "Click this message to learn more about the addon!",
    })
  } else if (VersionManager.mustShowUpdateNotification(details)) {
    // Upgrade notification
    Logger.log(`IMP has been upgraded from ${details.previousVersion} !`)
    browser.notifications.create(NotificationIds.ADDON_UPGRADED, {
      type: "basic",
      title: "Yay, In My Pocket has been upgraded 🎉",
      message: "Click this message to learn what's new!",
    })

    // Check if need to trigger a full resync
    browser.storage.local
      .get(["access_token", "lastFullSyncAtVersion"])
      .then(({ access_token, lastFullSyncAtVersion }) => {
        if (access_token && VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)) {
          Logger.log("IMP version needs a resync")
          ItemsFetcher.retrieveItems(true)
        }
      })
  }
})

browser.notifications.onClicked.addListener(notificationId => {
  switch (notificationId) {
    case NotificationIds.ADDON_INSTALLED:
      browser.notifications.clear(notificationId)
      browser.tabs.create({
        url: "https://inmypocketaddon.com/faq.html?utm_source=addon&utm_medium=notification&utm_campaign=install",
      })
      break
    case NotificationIds.ADDON_UPGRADED:
      browser.notifications.clear(notificationId)
      browser.tabs.create({
        url: "https://inmypocketaddon.com/changelog.html?utm_source=addon&utm_medium=notification&utm_campaign=upgrade",
      })
      break
  }
})
