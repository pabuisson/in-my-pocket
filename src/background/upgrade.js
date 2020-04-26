"use strict";

import retrieveItems from '../background/background.js';
import Logger  from '../modules/logger.js';
import { VersionManager } from '../modules/version_manager.js';

const installNotificationId = '0001';
const upgradeNotificationId = '0002';

browser.runtime.onInstalled.addListener(details => {
  if(details.reason === 'install') {
    Logger.log('Fresh install! Welcome on board :)');
    browser.notifications.create(installNotificationId, {
      type: 'basic',
      title: 'Yay, welcome to In My Pocket 🎉',
      message: 'Click this message to learn more about the addon!',
    });
  } else if(VersionManager.mustShowUpdateNotification(details)) {
    // Upgrade notification
    Logger.log(`IMP has been upgraded from ${details.previousVersion} !`);
    browser.notifications.create(upgradeNotificationId, {
      type: 'basic',
      title: 'Yay, In My Pocket has been upgraded 🎉',
      message: "Click this message to learn what's new!",
    });

    // Check if need to trigger a full resync
    browser.storage.local.get(['access_token', 'lastFullSyncAtVersion'])
      .then(({ access_token, lastFullSyncAtVersion }) => {
        if (access_token && VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)) {
          Logger.log('IMP version needs a resync');
          retrieveItems(true);
        }
      });
  }
});

browser.notifications.onClicked.addListener(notificationId => {
  switch(notificationId) {
    case installNotificationId:
      browser.notifications.clear(notificationId);
      browser.tabs.create({ url: 'https://inmypocketaddon.com/faq.html?utm_source=addon&utm_medium=notification&utm_campaign=install' });
      break;
    case upgradeNotificationId:
      browser.notifications.clear(notificationId);
      browser.tabs.create({ url: 'https://inmypocketaddon.com/changelog.html?utm_source=addon&utm_medium=notification&utm_campaign=upgrade' });
      break;
  }
});
