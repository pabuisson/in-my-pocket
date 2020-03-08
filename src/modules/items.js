"use strict";

import Badge from './badge.js';
import Logger from './logger.js';
import PageAction from './page_action.js';
import PocketApiRequester from './pocket_api_requester.js';
import Settings from './settings.js';
import Utility from './utility.js';
import { PocketNotice, concealedProtocols } from './constants.js';


// ---------------


const Items = ( function() {
  let currentChecksum = null;
  let parsedItems     = null;

  function parseItems(rawItems) {
    const rawItemsChecksum = rawItems ? rawItems.length : 0;
    Logger.log(`(Items.parseItems) checksum: ${currentChecksum} ; new: ${rawItemsChecksum}`);

    if( rawItemsChecksum != currentChecksum ) {
      Logger.log('(Items.parsedItems) checksum not defined, parse those items for the first time');

      currentChecksum = rawItemsChecksum;
      parsedItems = Utility.parseJson( rawItems );
    }

    return parsedItems || [];
  }

  // Query must be something like "a string" or "a string is:faved" or "a string is:unfaved"
  function matchQuery(item, query) {
    const lowerQuery = query.toLowerCase();

    const isFavedCriteria   = lowerQuery.includes('is:faved');
    const isUnfavedCriteria = lowerQuery.includes('is:unfaved');
    const textCriteria      = lowerQuery.replace(/is:(faved|unfaved)/, '').trim();

    return matchFavedUnfaved(item, isFavedCriteria, isUnfavedCriteria) &&
      matchText(item, textCriteria);
  }

  function matchText(item, textToMatch) {
    if(textToMatch === '')
      return true;

    const protocolsToRemove = concealedProtocols.join('|');
    const protocolsRemovalRegex = new RegExp(`^(${protocolsToRemove})://(www.)?`, 'gi');

    const lowerUrl = (item.resolved_url.replace(protocolsRemovalRegex, '') || '').toLowerCase();
    const lowerTitle = (item.resolved_title || '').toLowerCase();

    return lowerTitle.includes(textToMatch) || lowerUrl.includes(textToMatch);
  }

  function matchFavedUnfaved(item, keepFaved, keepUnfaved) {
    if(keepFaved) {
      return item.fav === "1";
    } else if(keepUnfaved) {
      return item.fav === "0" || !item.fav;
    }

    // No faved/unfaved criteria, should not filter the item out
    return true;
  }

  // TODO: 'method' param should not be a magical string. Define fixed values in a module
  function removeItem(itemId, method, tabId) {
    Logger.log('(Items.removeItem) id to remove: ' + itemId );
    Badge.startLoadingSpinner();

    browser.storage.local.get([ 'access_token', 'items' ]).then( ({ access_token, items }) => {
      const apiRequester = new PocketApiRequester(access_token);
      const callbackAction = method == 'archive' ? 'marked-as-read' : 'deleted';
      const removalPromise = method == 'archive' ? apiRequester.archive(itemId) : apiRequester.delete(itemId);

      removalPromise.then(response => {
        const parsedItems    = Utility.parseJson(items) || [];
        const removedItemIdx = parsedItems.findIndex( item => item.id === itemId );
        const removedItem    = parsedItems[removedItemIdx];

        if(removedItemIdx >= 0) {
          Logger.log(`(Items.removeItem) item ${itemId} has been found and removed`);

          // Remove the archived item from the list and save list in storage
          parsedItems.splice(removedItemIdx, 1);
          browser.storage.local.set({ items: JSON.stringify(parsedItems) });

          // Send a message back to the UI
          browser.runtime.sendMessage({ action: callbackAction, id: itemId });

          // Display an indicator on the badge that everything went well and update badge count
          Badge.flashSuccess().then( () => {
            // Close the current tab if setting closeTabWhenAdded is "on"
            // and if its url matches the deleted item
            if(tabId) {
              browser.tabs.get(tabId).then(currentTab => {
                if(currentTab.url == removedItem.resolved_url) {
                  Settings.init().then( () => {
                    const closeTabWhenRead = Settings.get('closeTabWhenRead');
                    if(closeTabWhenRead) {
                      Logger.log('(Items.removeItem) automatically close tab');
                      setTimeout( () => {
                        browser.tabs.remove(currentTab.id);
                      }, 200);
                    }
                  });
                }
              });
            }

            // Disable page actions for removed items
            Logger.log('(Items.removeItem) item removed, update matching pageActions');
            browser.tabs.query({ url: removedItem.resolved_url }).then(tabs => {
              const tabIds = tabs.map(tab => tab.id);
              PageAction.drawDisabled(...tabIds);
            });
            browser.tabs.query({ url: 'https://app.getpocket.com/read/' + removedItem.id }).then( (tabs) => {
              for(const tab of tabs) {
                Logger.log('(Items.removeItem) draw disabled page action for ' + tab.url);
                PageAction.drawDisabled(tab.id);
              }
            });
            browser.tabs.query({ url: 'https://getpocket.com/a/read/' + removedItem.id }).then( (tabs) => {
              for(const tab of tabs) {
                Logger.log('(Items.removeItem) draw disabled page action for ' + tab.url);
                PageAction.drawDisabled(tab.id);
              }
            });
          });
        } else {
          // NOTE: in that case, badge state must be restored and spinner should stop
          Logger.warn(`(Items.removeItem) item ${itemId} could not be found!`);
          Badge.updateCount();
        }
      }).catch(error => {
        Logger.error(`(Items.removeItem) Error while removing item: ${JSON.stringify(error)}`);
        Badge.flashError();
      });
    });
  }

  // rawItems = items to add { url:, title:, tabId: }
  // parsedItems = items returned by Pocket API
  function enrichParsedItems(parsedItems, rawItems) {
    return parsedItems.map(parsedItem => {
      if(!parsedItem.title) {
        const rawItem = rawItems.find(item => parsedItem.given_url == item.url);
        parsedItem.title = rawItem ? rawItem.title : '—';
      }

      return parsedItem;
    });
  }

  function setFavorite(itemId, action) {
    Logger.log('(Items.setFavorite)');

    browser.storage.local.get(['access_token', 'items']).then(({ access_token, items }) => {
      Badge.startLoadingSpinner();
      const requester = new PocketApiRequester(access_token);
      const request = action === 'favorite' ?
        requester.favorite(itemId) :
        requester.unfavorite(itemId);

      request.then(response => {
        const parsedItems = Utility.parseJson(items) || [];

        // Update item in parsedItems
        const updatedItem = parsedItems.find(item => item.id == itemId);
        updatedItem.fav = (action === 'favorite' ? 1 : 0);

        // Save item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify(parsedItems) });

        // Send a message back to the UI: favorited/unfavorited
        const actionOver = `${action}d`;
        browser.runtime.sendMessage({ action: actionOver, id: itemId });

        // Display an indicator on the badge that everything went well
        Badge.flashSuccess();
      })
      .catch(error => {
        Logger.error(`(Items.setFavorite) Error for action ${action} : ${JSON.stringify(error)}`);
        Badge.flashError();
      });
    });
  }

  return {
    formatPocketItemForStorage: function(itemFromApi) {
      return {
        resolved_title: itemFromApi.given_title || itemFromApi.resolved_title,
        resolved_url:   itemFromApi.given_url || itemFromApi.resolved_url,
        fav:            itemFromApi.favorite,
        created_at:     itemFromApi.time_added
      };
    },

    filter: function(rawItems, query) {
      const parsedItems = parseItems(rawItems);
      let filteredItems = undefined;

      if(query == '' || !query) {
        filteredItems = parsedItems;
      } else {
        filteredItems = parsedItems.filter(item => matchQuery(item, query));
      }

      return filteredItems;
    },

    contains: function(rawItems, searchedItem = {}) {
      if(!searchedItem.hasOwnProperty('id') && !searchedItem.hasOwnProperty('url')) {
        return false;
      }

      const id  = searchedItem.id;
      const url = searchedItem.url;
      const parsedItems = parseItems(rawItems);

      return parsedItems.some( item => {
        let itemMatching = false;
        if(id)  { itemMatching = itemMatching || item.id == id; }
        if(url) { itemMatching = itemMatching || item.resolved_url == url; }

        return itemMatching;
      });
    },

    find: function(rawItems, searchedItem = {}) {
      if( !searchedItem.hasOwnProperty('id') && !searchedItem.hasOwnProperty('url') ) {
        return null;
      }

      const id  = searchedItem.id;
      const url = searchedItem.url;
      const parsedItems = parseItems(rawItems || []);

      return parsedItems.find( item => {
        let itemMatching = false;
        if(id)  { itemMatching = itemMatching || item.id == id; }
        if(url) { itemMatching = itemMatching || item.resolved_url == url; }

        return itemMatching;
      });
    },

    // TODO: I call both filter and paginate most of the time...but for consistency, I should
    //       call paginate with raw items as well?
    paginate: function(parsedItems, page, perPage) {
      const itemsCount = parsedItems.length;
      const sortedItems = parsedItems.sort( (a, b) => b.created_at - a.created_at );

      if(!perPage || itemsCount === 0) {
        return sortedItems;
      }

      const pagesCount = Math.ceil(itemsCount / perPage);

      if(page <= 0 || page > pagesCount) {
        Logger.warn(`Could not get page ${page} (${itemsCount} items, asked ${perPage} per page)`);
      } else {
        const fromIndex = (page - 1) * perPage;
        const toIndex   = (page * perPage) - 1;

        return sortedItems.slice(fromIndex, toIndex + 1);
      }
    },

    // ---------------

    favoriteItem: function(itemId) { setFavorite(itemId, 'favorite'); },
    unfavoriteItem: function(itemId) { setFavorite(itemId, 'unfavorite'); },

    addItem: function(itemsToAdd) {
      Logger.log('(Items.addItem)');
      Badge.startLoadingSpinner();

      browser.storage.local.get(['access_token', 'items']).then(({ access_token, items }) => {
        const newItemsToAdd = itemsToAdd.filter(item => !Items.contains(items, { url: item.url }));
        if(newItemsToAdd.length === 0) {
          // Instead of just logging, send an event back to the UI and exit
          browser.runtime.sendMessage({ notice: PocketNotice.ALREADY_IN_LIST });
          return;
        }

        Badge.startLoadingSpinner();
        const requester = new PocketApiRequester(access_token);
        const request = newItemsToAdd.length === 1 ?
          requester.add(newItemsToAdd[0]) :
          requester.addBatch(newItemsToAdd);

        request.then(response => {
          const parsedItems = Utility.parseJson(items) || [];
          const addedItems = (response.item ? [response.item] : response.action_results);
          const enrichedAddedItems  = enrichParsedItems(addedItems, newItemsToAdd);

          enrichedAddedItems.forEach(newItem => {
            parsedItems.push({
              id:             newItem.item_id,
              resolved_title: newItem.title,
              resolved_url:   newItem.given_url,
              created_at:     (Date.now()/1000 | 0)
            });
          });

          // Save item list in storage and update badge count
          browser.storage.local.set({ items: JSON.stringify(parsedItems) });

          // Send a message back to the UI
          // TODO: send multiple ids? what are they used for?
          browser.runtime.sendMessage({ action: 'added-item', id: addedItems.map(item => item.item_id) });

          // Display an indicator on the badge that everything went well
          Badge.flashSuccess().then(() => {
            // Close the given tab if setting closeTabWhenAdded is "on"
            Settings.init().then( () => {
              const closeTabWhenAdded = Settings.get('closeTabWhenAdded');
              if(closeTabWhenAdded) {
                const tabIdsToClose = newItemsToAdd.map(item => item.tabId);
                setTimeout( () => {
                  browser.tabs.remove(tabIdsToClose);
                }, 200);
              }
            });

            // Redraw every page pageAction
            Logger.log('(Items.addItem) new items added, update matching pageActions');
            browser.tabs.query({ url: enrichedAddedItems.map(item => item.given_url) }).then(tabs => {
              const tabIds = tabs.map(tab => tab.id);
              PageAction.drawEnabled(...tabIds);
            });
          });
        })
          .catch(error => {
            Logger.error(`(Items.addItem) Error while adding item: ${JSON.stringify(error)}`);
            Badge.flashError();
          });
      });
    },

    markAsRead : function(itemId, tabId) { removeItem(itemId, 'archive', tabId); },
    deleteItem:  function(itemId, tabId) { removeItem(itemId, 'delete', tabId); },

    open: function(itemId, forceNewTab = false) {
      Settings.init().then( () => {
        const openInNewTab      = Settings.get('openInNewTab') || forceNewTab;
        const archiveWhenOpened = Settings.get('archiveWhenOpened');

        browser.storage.local.get('items').then( ({ items }) => {
          const item = Items.find(items, { id: itemId });

          if(openInNewTab) {
            browser.tabs.create({ url: item.resolved_url });
          } else {
            browser.tabs.update({ url: item.resolved_url });
          }

          if(archiveWhenOpened) {
            Items.markAsRead(item.id);
          }
        });
      });
    },

    openRandom: function(query = '') {
      browser.storage.local.get('items').then( ({ items }) => {
        const filteredItems = Items.filter(items, query);

        if(filteredItems.length > 0) {
          const item = filteredItems[ Math.floor( Math.random() * filteredItems.length ) ];
          Items.open(item.id);
        }
      });
    },

    openFirst: function(query = '') {
      browser.storage.local.get('items').then( ({ items }) => {
        const filteredItems = Items.filter(items, query);

        if(filteredItems.length > 0) {
          const sortedItems = filteredItems.sort( (a, b) => b.created_at - a.created_at );
          const firstItem = sortedItems[0];
          Items.open(firstItem.id);
        }
      });
    }
  };
})();

export default Items;
