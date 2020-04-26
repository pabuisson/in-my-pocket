
"use strict";

import Badge from './badge.js';
import Items from './items.js';
import Logger from './logger.js';
import PageAction from './page_action.js';
import Request from './request.js';
import Utility from './utility.js';
import { VersionManager } from './version_manager.js';
import { consumerKey, PocketApiStatus } from './constants.js';


// ---------------


const ItemsFetcher = (function () {
  return {
    retrieveItems: function(force) {
      const intervalWithoutReload = 15*60;
      const currentTimestamp      = (Date.now()/1000 | 0);

      browser.storage.local.get(['items', 'last_retrieve']).then( ({ items, last_retrieve }) => {
        const timeSinceLastRetrieve = currentTimestamp - last_retrieve;
        Logger.log(`(bg.retrieveItems) timeout: ${timeSinceLastRetrieve} / ${intervalWithoutReload}`);

        if (force || !items || !last_retrieve) {
          // If force == true, we always reload the whole list
          ItemsFetcher.retrieveAll();
        } else if(timeSinceLastRetrieve > intervalWithoutReload) {
          // If we already have sync, check if intervalWithoutReload is past, then we can reload
          ItemsFetcher.retrieveDiff();
        } else {
          // Do this to stop the main-loader component
          browser.runtime.sendMessage({ action: 'retrieved-items' });
          // Update the badge count, in case it wasn't displayed but no items reload happened
          Badge.updateCount();
        }
      });
    },

    retrieveAll: function(offset = 0) {
      Logger.log('(bg.retrieveAll) Retrieve all items');
      const isRetrievingFirstPage = (offset === 0);

      browser.storage.local.get(['access_token', 'items']).then( ({ access_token, items }) => {
        const itemsList = (items && !isRetrievingFirstPage ? Utility.parseJson(items) : []);
        const requestParams = {
          consumer_key: consumerKey,
          access_token: access_token,
          detailType: 'simple',
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
                ItemsFetcher.retrieveAll(retrievedItemsCount + offset);
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
    },

    retrieveDiff: function() {
      Logger.log('(bg.retrieveDiff)');

      browser.storage.local.get(['access_token', 'last_retrieve', 'items']).then(
        ({ access_token, last_retrieve, items }) => {
          const requestParams = {
            consumer_key: consumerKey,
            access_token: access_token,
            detailType: 'simple',
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
                    const itemIdx = allItems.findIndex(item => item.id === itemId);

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
  };
})();

export default ItemsFetcher;