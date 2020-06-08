"use strict";

import Authentication from '../modules/authentication.js';
import Badge from '../modules/badge.js';
import ContextMenu from '../modules/context_menu.js';
import Items from '../modules/items.js';
import Logger from '../modules/logger.js';
import PageAction from '../modules/page_action.js';
import Request from '../modules/request.js';
import Utility from '../modules/utility.js';
import { VersionManager } from '../modules/version_manager.js';
import { consumerKey, PocketApiStatus } from '../modules/constants.js';

// - - - API ACCESS : LIST MANAGEMENT - - -

function retrieveItems(force) {
  const intervalWithoutReload = 15*60;
  const currentTimestamp      = (Date.now()/1000 | 0);

  browser.storage.local.get(['items', 'last_retrieve']).then( ({ items, last_retrieve }) => {
    const timeSinceLastRetrieve = currentTimestamp - last_retrieve;
    Logger.log(`(bg.retrieveItems) timeout: ${timeSinceLastRetrieve} / ${intervalWithoutReload}`);

    if (force || !items || !last_retrieve) {
      // If force == true, we always reload the whole list
      retrieveAll();
    } else if(timeSinceLastRetrieve > intervalWithoutReload) {
      // If we already have sync, check if intervalWithoutReload is past, then we can reload
      retrieveDiff();
    } else {
      // Do this to stop the main-loader component
      browser.runtime.sendMessage({ action: 'retrieved-items' });
      // Update the badge count, in case it wasn't displayed but no items reload happened
      Badge.updateCount();
    }
  });
}

function retrieveAll(offset = 0) {
  Logger.log('(bg.retrieveAll) Retrieve all items');
  const isRetrievingFirstPage = (offset === 0);

  browser.storage.local.get(['access_token', 'items']).then( ({ access_token, items }) => {
    const itemsList = (items && !isRetrievingFirstPage ? Utility.parseJson(items) : []);
    const requestParams = {
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'complete',
      offset: offset,
      count: 2000,
      sort: 'oldest',
    };

    // https://getpocket.com/developer/docs/v3/retrieve
    new Request('POST', 'https://getpocket.com/v3/get', requestParams)
      .fetch()
      .then(response => {
        const retrievedItemsCount = Object.keys(response.list).length;
        Logger.log(`(bg.retrieveAll) ${retrievedItemsCount} items in the response`);

        const newItems = Object.keys(response.list).map(itemId => {
          return { id: itemId, ...Items.formatPocketItemForStorage(response.list[itemId]) };
        });

        const allItems = [...itemsList, ...newItems];

        // Save item list in storage
        browser.storage.local.set({ items: JSON.stringify(allItems) }).then(() => {
          Badge.updateCount(allItems);

          if(retrievedItemsCount > 0) {
            Logger.log(`(bg.retrieveAll) Fetch next page: offset=${offset}`);
            retrieveAll(retrievedItemsCount + offset);
            return;
          } else if (retrievedItemsCount === 0) {
            Logger.log(`(bg.retrieveAll) 0 item in this page, all pages have been fetched succesfully`);

            // Save timestamp where we retrieved items for the last time
            // Save addon version that did the last full sync
            browser.storage.local.set({
              last_retrieve: response.since,
              lastFullSyncAtVersion: VersionManager.getCurrentVersion()
            });

            browser.runtime.sendMessage({ action: 'retrieved-items', full: true });
            PageAction.redrawAllTabs();
          }
        });
      })
      .catch(error => {
        Logger.error(`(bg.retrieveAll) Error: ${ JSON.stringify(error) }`);
        Badge.flashError();
      });
  });
}

function retrieveDiff() {
  Logger.log('(bg.retrieveDiff)');

  browser.storage.local.get(['access_token', 'last_retrieve', 'items']).then(
    ({ access_token, last_retrieve, items }) => {
      const requestParams = {
        consumer_key: consumerKey,
        access_token: access_token,
        detailType: 'complete',
        state: 'all',
        since: last_retrieve
      };
      new Request('POST', 'https://getpocket.com/v3/get', requestParams)
        .fetch()
        .then( function(response) {
          Logger.log(Object.keys(response.list).length + ' items in the response');
          const allItems = Utility.parseJson(items) || [];

          for(const itemId in response.list) {
            const item = response.list[itemId];

            switch(item.status) {
              case PocketApiStatus.ARCHIVED:
              case PocketApiStatus.DELETED:
                Logger.log(`(bg.retriveDiff) NEED TO ARCHIVE: ${itemId} (${item.title})`);
                const removedItemIdx = allItems.findIndex(item => item.id === itemId);

                if(removedItemIdx >= 0) {
                  Logger.log('(bg.retrieveDiff) Item found,  will be removed from the stored items');
                  allItems.splice(removedItemIdx, 1);
                } else {
                  Logger.warn('(bg.retrieveDiff) Could not find the item to archive in the stored items');
                }
                break;

              case PocketApiStatus.CREATED:
                const itemIdx = allItems.findIndex( item => item.id === itemId );
                if(itemIdx >= 0) {
                  Logger.log(`(bg.retriveDiff) Existing item ${itemId} (${item.title}) will be updated`);
                  allItems[itemIdx] = Object.assign(allItems[itemIdx], Items.formatPocketItemForStorage(item));
                } else {
                  Logger.log(`(bg.retriveDiff) Add new item: ${itemId} (${item.title})`);
                  allItems.push({ id: item.item_id, ...Items.formatPocketItemForStorage(item) });
                }
                break;
              default:
                Logger.log(`(bg.retriveDiff) Unknown item status: ${item.status}`);
                break;
            }
          }

          // Save item list in storage and update badge count
          browser.storage.local.set({ items: JSON.stringify(allItems) });
          Badge.updateCount(allItems);

          // Update the last_retrieve timestamp in the database
          // TODO: if there were error, don't update the `last_retrieve` timestamp ? Would it play
          //       nicely with the items that were correctly removed/added?
          browser.storage.local.set({ last_retrieve: response.since });

          // Send a message back to the UI and updates the tabs page actions
          browser.runtime.sendMessage({ action: 'retrieved-items' });
          PageAction.redrawAllTabs();
        })
        .catch(error => {
          // Even if something went wrong while retrieving diff, we still can display the current
          // items, so we send the `retrieved-items` event back to popup to build the item list
          Logger.warn(`(bg.retrieveDiff) something went wrong: ${JSON.stringify(error)}`);

          // Send a message back to the UI and updates the tabs page actions
          browser.runtime.sendMessage({ action: 'retrieved-items' });
          PageAction.redrawAllTabs();

          // Flash the badge if an error occured
          Badge.flashError();
        });
    });
}


// - - - MESSAGES - - -

browser.runtime.onMessage.addListener(function(eventData) {
  Logger.log( `(bg.onMessage) eventData.action: ${eventData.action}` );
  switch(eventData.action) {
    case 'authenticate':
      Authentication.authenticate().then( () => {
        // Send a message back to the UI
        browser.runtime.sendMessage({ action: 'authenticated' });
        // Retrieve the items and update the badge count
        retrieveItems(true);
        // Create right click context menus
        ContextMenu.createEntries();
      });
      break;
    case 'retrieve-items':
      retrieveItems(eventData.force);
      break;
    case 'favorite':
      Items.favoriteItem(eventData.id);
      break;
    case 'unfavorite':
      Items.unfavoriteItem(eventData.id);
      break;
    case 'add-item':
      Items.addItem([{ url: eventData.url, title: eventData.title, tabId: eventData.tabId }]);
      break;
    case 'mark-as-read':
      Items.markAsRead(eventData.id, eventData.tabId);
      break;
    case 'delete-item':
      Items.deleteItem(eventData.id, eventData.tabId);
      break;
    case 'update-badge-count':
      Badge.updateCount();
      break;
    case 'read-item':
      Items.open(eventData.itemId, eventData.openInNewTab);
      break;
    case 'random-item':
      Items.openRandom(eventData.query);
      break;
    case 'flash-error':
      Badge.flashError();
      break;
    default:
      Logger.log(`(bg.onMessage) Unknown action: ${eventData.action}`);
  }
});


// - - - ON LOAD - - -

Authentication.isAuthenticated().then( function() {
  ContextMenu.createEntries();
  Badge.updateCount();
});

export default retrieveItems;
