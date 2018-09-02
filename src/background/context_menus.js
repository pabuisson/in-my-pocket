"use strict";

import ContextMenu from '../modules/context_menu.js';
import Items       from '../modules/items.js';
import Logger      from '../modules/logger.js';


// ---------------

browser.contextMenus.onClicked.addListener( (info, tab) => {
  switch( info.menuItemId )
  {
    case ContextMenu.addId:
      if( info.linkUrl ) {
        Items.addItem( info.linkUrl );
      } else {
        const addItemOptions = { closeTabId: tab.id };
        Items.addItem( info.pageUrl, tab.title, addItemOptions );
      }
      break;

    case ContextMenu.archiveId:
      browser.storage.local.get( "items" ).then( ({ items }) => {
        const item = Items.find( items, { url: info.linkUrl || info.pageUrl });
        if( item ) {
          Items.markAsRead( item.id );
        }
      });
      break;

    case ContextMenu.deleteId:
      browser.storage.local.get( "items" ).then( ({ items }) => {
        const item = Items.find( items, { url: info.linkUrl || info.pageUrl });
        if( item ) {
          Items.deleteItem( item.id );
        }
      });
      break;
  }
});


// - - -    HANDLE CONTEXT MENU UPDATES    - - -

// When context menu is shown, I update the status of the right-click entries
// It can be a right click on the page, on a link or on a tab
// NOTE: as of 201808, there's no way to handle multi-selected tabs

// browser.contextMenus.onShown available for FF 60+ only
if(browser.contextMenus.onShown) {
  browser.contextMenus.onShown.addListener( (info, tab) => {
    const url = info.linkUrl ? info.linkUrl : info.pageUrl;

    browser.storage.local.get("items").then( ({ items }) => {
      const containsItem = Items.contains( items, { url: url });

      if(containsItem) {
        Logger.log("(background.onShown) updating contextMenu for " + url + " that IS in my list");
        ContextMenu.setState( ContextMenu.pageAlreadyInPocket ).then( () => {
          browser.contextMenus.refresh();
        });
      } else {
        Logger.log( "(background.onShown) updating contextMenu for " + url + " that ISN'T in my list...yet");
        ContextMenu.setState( ContextMenu.pageNotInPocket ).then( () => {
          browser.contextMenus.refresh();
        });
      }
    });
  });
} else {
  // 1. When current tab url is changing
  browser.tabs.onUpdated.addListener( ( tabId, changeInfo ) => {
    if(changeInfo.hasOwnProperty('url')) {
      browser.tabs.get( tabId ).then( tab => {
        if(tab.active) {
          browser.storage.local.get("items").then( ({ items }) => {
            const containsItem = Items.contains( items, { url: tab.url });

            if(containsItem) {
              Logger.log("(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that IS in my list");
              ContextMenu.setState( ContextMenu.pageAlreadyInPocket );
            } else {
              Logger.log( "(background.tabsOnUpdated) current tab is loading " + changeInfo.url + " that ISN'T in my list...yet");
              ContextMenu.setState( ContextMenu.pageNotInPocket );
            }
          });
        }
      });
    }
  });

  // 2. When I switch to another tab, check if I need to update the state of context menus
  browser.tabs.onActivated.addListener( ({ tabId }) => {
    browser.tabs.get( tabId ).then( tab => {
      return tab.url;
    }).then( currentUrl => {
      browser.storage.local.get("items").then( ({ items }) => {
        const containsItem = Items.contains( items, { url: currentUrl });

        if(containsItem) {
          Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that IS in my list");
          ContextMenu.setState( ContextMenu.pageAlreadyInPocket );
        } else {
          Logger.log( "(background.tabsOnActivated) switching to a tab " + currentUrl + " that ISN'T in my list...yet !");
          ContextMenu.setState( ContextMenu.pageNotInPocket );
        }
      });
    });
  });
}
