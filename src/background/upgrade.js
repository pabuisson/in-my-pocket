"use strict";

import Logger  from '../modules/logger.js';
import { VersionManager, VERSION_LEVELS } from '../modules/version_manager.js';

const installNotificationId = '0001';
const upgradeNotificationId = '0002';


function mustShowUpdateNotification( details ) {
  const isUpdate = (details.reason == 'update');
  const isMajorOrMinorUpdate = VersionManager.isUpdate(details.previousVersion, VERSION_LEVELS.MINOR);

  return isUpdate && isMajorOrMinorUpdate;
}

browser.runtime.onInstalled.addListener( details => {
  if( details.reason == "install" ) {
    Logger.log("Fresh install! Welcome on board :)");
    browser.notifications.create( installNotificationId, {
      type: 'basic',
      title: 'Yay, welcome to In My Pocket 🎉',
      message: "Click this message to know more about the addon!",
    });
  } else if( mustShowUpdateNotification(details) ) {
    Logger.log("IMP has been upgraded from " + details.previousVersion + " !");
    browser.notifications.create( upgradeNotificationId, {
      type: 'basic',
      title: 'Yay, In My Pocket has been upgraded 🎉',
      message: "Click this message to see what's new!",
    });
  }
});


browser.notifications.onClicked.addListener(notificationId => {
  switch(notificationId) {
    case installNotificationId:
      browser.notifications.clear( notificationId );
      browser.tabs.create({ 'url': 'https://inmypocketaddon.com/faq.html?utm_source=addon&utm_medium=notification&utm_campaign=install' });
      break;
    case upgradeNotificationId:
      browser.notifications.clear( notificationId );
      browser.tabs.create({ 'url': 'https://inmypocketaddon.com/changelog.html?utm_source=addon&utm_medium=notification&utm_campaign=upgrade' });
      break;
  }
});

