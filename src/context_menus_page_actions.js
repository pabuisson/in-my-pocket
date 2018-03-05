"use strict";

import ContextMenu from './modules/context_menu.js';
import Items from './modules/items.js';
import Logger from './modules/logger.js';
import PageAction from './modules/page_action.js';


// ---------------


browser.contextMenus.onClicked.addListener( ( link, tab ) => {
  switch( link.menuItemId )
  {
    case ContextMenu.addId:
      if( link.linkUrl ) {
        Items.addItem( link.linkUrl );
      } else {
        Items.addItem( link.pageUrl, tab.title );
      }
      break;

    case ContextMenu.archiveId:
      browser.storage.local.get( "items" ).then( ({ items }) => {
        const item = Items.find( items, { url: tab.url });
        if( item ) {
          Items.markAsRead( item.id );
        }
      });
      break;

    case ContextMenu.deleteId:
      browser.storage.local.get( "items" ).then( ({ items }) => {
        const item = Items.find( items, { url: tab.url });
        if( item ) {
          Items.deleteItem( item.id );
        }
      });
      break;
  }
});


browser.pageAction.onClicked.addListener( ( tab ) => {
  PageAction.toggle( tab );
});


// - - - HANDLE CONTEXT MENUS AND PAGE ACTION UPDATES - - -
// - - - On navigation, and on tab switch             - - -

// 1. When current tab url is changing
browser.tabs.onUpdated.addListener( ( tabId, changeInfo ) => {
  if( changeInfo.hasOwnProperty('url') ) {
    browser.tabs.get( tabId ).then( ( tab ) => {
      // TODO: Maybe I can organize promises differently, so that I only access this handler
      //       when tab.active == true ? So I could remove one test / indentation level here
      if( tab.active ) {
        browser.storage.local.get( "items" ).then( ({ items }) => {
          // const parsedItems  = Utility.parseJson( items ) || [];
          const containsItem = Items.contains( items, { url: tab.url });

          if( containsItem ) {
            Logger.log("(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that IS in my list");
            // Context menu
            ContextMenu.setState( ContextMenu.pageAlreadyInPocket );
            // Page action
            PageAction.drawEnabled( tabId );
            PageAction.show( tabId );
          } else {
            Logger.log( "(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that ISN'T in my list...yet");
            // Context menu
            ContextMenu.setState( ContextMenu.pageNotInPocket );
            // Page action
            PageAction.drawDisabled( tabId );
            PageAction.show( tabId );
          }
        });
      }
    });
  }
});

// 2. When I switch to another tab, check if I need to update the state of context menus
browser.tabs.onActivated.addListener( ({ tabId }) => {
  browser.tabs.get( tabId ).then( function( tab ) {
    return tab.url;
  }).then( ( currentUrl ) => {
    browser.storage.local.get( "items" ).then( ({ items }) => {
      // const parsedItems  = Utility.parseJson( items ) || [];
      const containsItem = Items.contains( items, { url: currentUrl });

      if( containsItem ) {
        Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that IS in my list");
        // Context menu
        ContextMenu.setState( ContextMenu.pageAlreadyInPocket );
        // Page action
        PageAction.drawEnabled( tabId );
        PageAction.show( tabId );
      } else {
        Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that ISN'T in my list...yet !");
        // Context menu
        ContextMenu.setState( ContextMenu.pageNotInPocket );
        // Page action
        PageAction.drawDisabled( tabId );
        PageAction.show( tabId );
      }
    });
  });
});
