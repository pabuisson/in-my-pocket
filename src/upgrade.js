"use strict";

import Logger from './modules/logger.js';
import Utility from './modules/utility.js';

const upgradeNotificationId = '0001';


function mustShowUpdateNotification( details ) {
  const isUpdate = ( details.reason == 'update' );
  const isMajorOrMinorUpdate = Utility.isMajorOrMinorUpdate( details.previousVersion );

  return isUpdate && isMajorOrMinorUpdate;
}

browser.runtime.onInstalled.addListener( details => {
  if( details.reason == "install" ) {
    // TODO: maybe propose some tips, or send user to a FAQ or any kind of post-install page
    Logger.log("Fresh install! Welcome on board :)");
  } else if( mustShowUpdateNotification(details) ) {
    Logger.log("IMP has been upgraded from " + details.previousVersion + " !");
    browser.notifications.create( upgradeNotificationId, {
      type: 'basic',
      title: 'Yay, In My Pocket has been upgraded 🎉',
      message: "Click this message to see what's new!",
    });
  }
});


browser.notifications.onClicked.addListener( notificationId => {
  if( notificationId !== upgradeNotificationId ) {
    return;
  }

  browser.notifications.clear( notificationId );
  browser.tabs.create({ 'url': 'https://inmypocket.pabuisson.com/changelog.html' });
});

