"use strict";

import Items  from '../modules/items.js';
import Logger from '../modules/logger.js';
import PageAction from '../modules/page_action.js';


// ---------------

browser.pageAction.onClicked.addListener( tab => {
  PageAction.toggle( tab );
});


// - - -  PAGE ACTION UPDATES - - -

// 1. When current tab url is changing
browser.tabs.onUpdated.addListener( (tabId, changeInfo) => {
  if( changeInfo.hasOwnProperty('url') ) {
    browser.tabs.get( tabId ).then( ( tab ) => {
      if( tab.active ) {
        browser.storage.local.get("items").then( ({ items }) => {
          const containsItem = Items.contains( items, { url: tab.url });

          if( containsItem ) {
            Logger.log("(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that IS in my list");
            PageAction.drawEnabled( tabId );
            PageAction.show( tabId );
          } else {
            Logger.log( "(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that ISN'T in my list...yet");
            PageAction.drawDisabled( tabId );
            PageAction.show( tabId );
          }
        });
      }
    });
  }
});

// 2. When I switch to another tab, check if I need to update the state of page action
browser.tabs.onActivated.addListener( ({ tabId }) => {
  browser.tabs.get( tabId ).then( tab => {
    return tab.url;
  }).then( currentUrl => {
    browser.storage.local.get("items").then( ({ items }) => {
      const containsItem = Items.contains( items, { url: currentUrl });

      if( containsItem ) {
        Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that IS in my list");
        PageAction.drawEnabled( tabId );
        PageAction.show( tabId );
      } else {
        Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that ISN'T in my list...yet !");
        PageAction.drawDisabled( tabId );
        PageAction.show( tabId );
      }
    });
  });
});
