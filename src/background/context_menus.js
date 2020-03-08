"use strict";

import ContextMenu from '../modules/context_menu.js';
import Items       from '../modules/items.js';
import Logger      from '../modules/logger.js';


// ---------------

browser.contextMenus.onClicked.addListener( (info, tab) => {
  switch(info.menuItemId)
  {
    case ContextMenu.addId:
      if(info.linkUrl) {
        Items.addItem([{url: info.linkUrl }]);
      } else {
        browser.tabs.query({currentWindow: true, highlighted: true}).then( highlightedTabs => {
          const multipleTabsSelected = highlightedTabs.length > 1;
          const currentTabsAmongMultipleSelection = highlightedTabs.some(highlightedTab =>
            highlightedTab.url == tab.url
          );

          if(multipleTabsSelected && currentTabsAmongMultipleSelection) {
            const items = highlightedTabs.map(tab => {
              return {
                tabId: tab.id,
                url: tab.url,
                title: tab.title
              };
            });
            Items.addItem(items);
          } else {
            Items.addItem([{tabId: tab.id, url: tab.url, title: tab.title}]);
          }
        });
      }
      break;

    case ContextMenu.archiveId:
      browser.storage.local.get("items").then( ({ items }) => {
        const item = Items.find(items, { url: info.linkUrl || info.pageUrl });
        if(item) {
          browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
            Items.markAsRead(item.id, currentTab.id);
          });
        }
      });
      break;

    case ContextMenu.deleteId:
      browser.storage.local.get("items").then( ({ items }) => {
        const item = Items.find(items, { url: info.linkUrl || info.pageUrl });
        if(item) {
          browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
            Items.deleteItem(item.id, currentTab.id);
          });
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

    // If several tabs selected and user right-clicked one of them, we'll handle them differently
    browser.tabs.query({currentWindow: true, highlighted: true}).then( highlightedTabs => {
      const multipleTabsSelected = highlightedTabs.length > 1;
      const currentTabsAmongMultipleSelection = highlightedTabs.some(highlightedTab =>
        highlightedTab.url == tab.url
      );

      if(multipleTabsSelected && currentTabsAmongMultipleSelection) {
        Logger.log("(background.onShown) multiple tabs selected, right-clicked one of them");
        ContextMenu.setState(ContextMenu.multipleTabSelection).then( () => {
          browser.contextMenus.refresh();
        });
      } else {
        // If only one tab clicked OR tab clicked is outside the several highlighted tabs,
        // we'll only deal with this tab
        browser.storage.local.get("items").then( ({ items }) => {
          const containsItem = Items.contains( items, { url: url });

          if(containsItem) {
            Logger.log(`(background.onShown) update contextMenu for ${url} that IS in my list`);
            ContextMenu.setState( ContextMenu.pageAlreadyInPocket ).then( () => {
              browser.contextMenus.refresh();
            });
          } else {
            Logger.log(`(background.onShown) update contextMenu for ${url} that ISN'T in my list`);
            ContextMenu.setState( ContextMenu.pageNotInPocket ).then( () => {
              browser.contextMenus.refresh();
            });
          }
        });
      }
    });
  });
} else {
  // 1. When current tab url is changing
  browser.tabs.onUpdated.addListener( (tabId, changeInfo) => {
    if(changeInfo.hasOwnProperty('url')) {
      browser.tabs.get( tabId ).then( tab => {
        if(tab.active) {
          browser.storage.local.get("items").then( ({ items }) => {
            const containsItem = Items.contains(items, { url: tab.url });

            if(containsItem) {
              Logger.log(`(background.tabsOnUpdated) current tab loading ${changeInfo.url} that IS in my list`);
              ContextMenu.setState(ContextMenu.pageAlreadyInPocket);
            } else {
              Logger.log(`(background.tabsOnUpdated) current tab loading ${changeInfo.url} that ISN'T in my list`);
              ContextMenu.setState(ContextMenu.pageNotInPocket);
            }
          });
        }
      });
    }
  });

  // 2. When I switch to another tab, check if I need to update the state of context menus
  browser.tabs.onActivated.addListener( ({ tabId }) => {
    browser.tabs.get(tabId).then( tab => {
      return tab.url;
    }).then( currentUrl => {
      browser.storage.local.get("items").then( ({ items }) => {
        const containsItem = Items.contains(items, { url: currentUrl });

        if(containsItem) {
          Logger.log(`(background.tabsOnActivated) switch to a tab ${currentUrl} that IS in my list`);
          ContextMenu.setState(ContextMenu.pageAlreadyInPocket);
        } else {
          Logger.log(`(background.tabsOnActivated) switch to a tab ${currentUrl} that ISN'T in my list`);
          ContextMenu.setState(ContextMenu.pageNotInPocket);
        }
      });
    });
  });
}
