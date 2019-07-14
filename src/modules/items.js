"use strict";

import Badge from './badge.js';
import Logger from './logger.js';
import PageAction from './page_action.js';
import PocketApiRequester from './pocket_api_requester.js';
import Settings from './settings.js';
import Utility from './utility.js';
import { PocketNotice } from './constants.js';


// ---------------


const Items = ( function() {
  let currentChecksum = null;
  let parsedItems     = null;

  function parseItems(rawItems) {
    const rawItemsChecksum = rawItems.length;
    Logger.log(`(Items.parseItems) checksum: ${currentChecksum} ; new: ${rawItemsChecksum}`);

    if( rawItemsChecksum != currentChecksum ) {
      Logger.log('(Items.parsedItems) checksum not defined, parse those items for the first time');

      currentChecksum = rawItemsChecksum;
      parsedItems = Utility.parseJson( rawItems );
    }

    return parsedItems || [];
  }

  // TODO: exclude the protocol
  function matchQuery( item, query ) {
    const lowerQuery = query.toLowerCase();
    const lowerTitle   = (item.resolved_title || '').toLowerCase();
    const lowerUrl     = (item.resolved_url   || '').toLowerCase();

    return lowerTitle.includes(lowerQuery) || lowerUrl.includes(lowerQuery);
  }

  // TODO: 'method' param should not be a magical string. Define fixed values in a module
  function removeItem( itemId, method ) {
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
          Logger.log('(Items.removeItem) item ' + itemId + ' has been found and removed');

          // Remove the archived item from the list and save list in storage
          parsedItems.splice(removedItemIdx, 1);
          browser.storage.local.set({ items: JSON.stringify(parsedItems) });

          // Send a message back to the UI
          browser.runtime.sendMessage({ action: callbackAction, id: itemId });

          // Display an indicator on the badge that everything went well and update badge count
          Badge.flashSuccess().then( () => {
            // Redraw page actions
            Logger.log('(Items.removeItem) item has been removed, update all matching pageActions');
            browser.tabs.query({ url: removedItem.resolved_url }).then( (tabs) => {
              for(const tab of tabs) {
                Logger.log('(Items.removeItem) draw disabled page action for ' + tab.url);
                PageAction.drawDisabled(tab.id);
              }
            });
          });
        } else {
          // NOTE: in that case, badge state must be restored and spinner should stop
          Logger.warn('(Items.removeItem) item ' + itemId + ' could not be found!' );
          Badge.updateCount();
        }
      }).catch( error => {
        Logger.error('(Items.removeItem) Error while removing an item');
        Logger.error(`(Items.removeItem) ${ JSON.stringify(error) }`);
        Badge.flashError();
      });
    });
  }

  return {
    filter: function(rawItems, query) {
      const parsedItems = parseItems(rawItems);
      let filteredItems = undefined;

      if(query == '' || !query) {
        filteredItems = parsedItems;
      } else {
        filteredItems = parsedItems.filter( item => matchQuery(item, query) );
      }

      return filteredItems;
    },

    contains: function( rawItems, searchedItem = {} ) {
      if( !searchedItem.hasOwnProperty('id') && !searchedItem.hasOwnProperty('url') ) {
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
      const parsedItems = parseItems(rawItems);

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

      if(!perPage || itemsCount == 0) {
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

    // DONE: transform this to take an array of { url: title: } objects
    // TODO: make options.closeTabId part of each item?!
    // TODO: pass id of the tab into the item object as "tabId" rather than separate thing
    // addItem: function(url, title, options = {}) {
    addItem: function(itemsToAdd) {
      Logger.log('(Items.addItem)');
      Badge.startLoadingSpinner();

      browser.storage.local.get(['access_token', 'items']).then(({ access_token, items }) => {
        const newItems = itemsToAdd.filter(item => !Items.contains(items, { url: item.url }));
        if(newItems.length === 0) {
          // Instead of just logging, send an event back to the UI and exit
          browser.runtime.sendMessage({ notice: PocketNotice.ALREADY_IN_LIST });
          return;
        }

        const requester = new PocketApiRequester(access_token);
        const request = newItems.length == 1 ? requester.add(newItems[0]) : requester.addBatch(newItems);

        request.then(response => {
          const parsedItems = Utility.parseJson(items) || [];
          const addItems    = [ response.item ] || response.action_results;

          addItems.forEach(newItem => {
            parsedItems.push({
              id:             newItem.item_id,
              resolved_title: newItem.title,
              resolved_url:   newItem.resolved_url,
              created_at:     (Date.now()/1000 | 0)
            });
          });

          // Save item list in storage and update badge count
          browser.storage.local.set({ items: JSON.stringify(parsedItems) });

          // Send a message back to the UI
          browser.runtime.sendMessage({ action: 'added-item', id: newItem.item_id });

          // Display an indicator on the badge that everything went well
          Badge.flashSuccess().then(() => {
            // Close the given tab if setting closeTabWhenAdded is "on"
            Settings.init().then( () => {
              const closeTabWhenAdded = Settings.get('closeTabWhenAdded');
              if(closeTabWhenAdded) {
                const tabIdsToClose = newItems.map(item => item.tabId);
                setTimeout( () => {
                  browser.tabs.remove(tabIdsToClose);
                }, 200);
              }
            });

            // Redraw every page pageAction
            Logger.log('(Items.addItem) new items have been added, we will update all matching pageActions');
            browser.tabs.query({ url: newItems.map(item => item.resolved_url) }).then( function(tabs) {
              for(const tab of tabs) {
                Logger.log(`(Items.addItem) will draw enabled page action for ${tab.url}`);
                PageAction.drawEnabled(tab.id);
              }
            });
          });
        })
          .catch( error => {
            Logger.error('(Items.addItem) Error while adding a new item');
            Logger.error(`(Items.addItem) ${ JSON.stringify(error) }`);
            Badge.flashError();
          });
      });
    },

    markAsRead : function(itemId) {
      removeItem(itemId, 'archive');
    },

    deleteItem: function(itemId) {
      removeItem(itemId, 'delete');
    },

    open: function(itemId, forceNewTab = false) {
      Settings.init().then( () => {
        const openInNewTab      = Settings.get('openInNewTab') || forceNewTab;
        const archiveWhenOpened = Settings.get('archiveWhenOpened');

        browser.storage.local.get('items').then( ({ items }) => {
          const item = Items.find( items, { id: itemId } );

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
