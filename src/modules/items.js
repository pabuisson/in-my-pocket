"use strict";

import Badge from './badge.js';
import ContextMenu from './context_menu.js';
import Logger from './logger.js';
import PageAction from './page_action.js';
import PocketApiRequester from './pocket_api_requester.js';
import Settings from './settings.js';
import Utility from './utility.js';
import { PocketNotice } from './constants.js';


// ---------------


var Items = ( function() {
  let currentChecksum = null;
  let parsedItems     = null;

  function parseItems( rawItems ) {
    const rawItemsChecksum = rawItems.length;
    Logger.log(`(Items.parseItems) checksum: ${ currentChecksum } ; new: ${ rawItemsChecksum }`);

    if( rawItemsChecksum != currentChecksum ) {
      Logger.log('(Items.parsedItems) checksum not defined, parse those items for the first time');

      currentChecksum = rawItemsChecksum;
      parsedItems = Utility.parseJson( rawItems );
    }

    return parsedItems || [];
  }

  // TODO: do not search on the protocol
  function matchQuery( item, query ) {
    const lowerQuery = query.toLowerCase();
    const lowerTitle   = ( item.resolved_title || '' ).toLowerCase();
    const lowerUrl     = ( item.resolved_url   || '' ).toLowerCase();

    return lowerTitle.includes( lowerQuery ) || lowerUrl.includes( lowerQuery );
  }

  // TODO: 'method' param should not be a magical string. Define fixed values in a module
  function removeItem( itemId, method ) {
    Logger.log('(Items.removeItem) id to remove: ' + itemId );

    browser.storage.local.get([ 'access_token', 'items' ]).then( ({ access_token, items }) => {
      const apiRequester = new PocketApiRequester( access_token );
      const callbackAction = method == 'archive' ? 'marked-as-read' : 'deleted';
      const removalPromise = method == 'archive' ? apiRequester.archive( itemId ) : apiRequester.delete( itemId );

      removalPromise.then( response => {
        let parsedItems    = Utility.parseJson( items ) || [];
        let removedItemIdx = parsedItems.findIndex( item => item.id === itemId );
        let removedItem    = parsedItems[ removedItemIdx ];

        if( removedItemIdx >= 0 ) {
          Logger.log('(Items.removeItem) item ' + itemId + ' has been found and removed');

          // Remove the archived item from the list
          parsedItems.splice( removedItemIdx, 1 );

          // Save edited item list in storage
          browser.storage.local.set({ items: JSON.stringify( parsedItems ) });
          // Display an indicator on the badge that everything went well and update badge count
          Badge.flashSuccess();
        } else {
          Logger.warn('Items.removeItem) item ' + itemId + ' could not be found!' );
        }

        // Send a message back to the UI
        browser.runtime.sendMessage({ action: callbackAction, id: itemId });

        // Redraw page actions
        if( removedItem ) {
          Logger.log('(Items.removeItem) item has been removed, update all matching pageActions');
          browser.tabs.query( { url: removedItem.resolved_url } ).then( function( tabs ) {
            for( const tab of tabs ) {
              Logger.log('(Items.removeItem) draw disabled page action for ' + tab.url );
              PageAction.drawDisabled( tab.id );
            }
          });
        }
      })
      .catch( error => {
        Logger.error('(Items.removeItem) Error while removing an item');
        Logger.error(`(Items.removeItem) ${ JSON.stringify(error) }`);
        Badge.flashError();
      });
    });
  }

  return {
    filter: function( rawItems, query ) {
      let parsedItems   = parseItems( rawItems );
      let filteredItems = undefined;

      if( query == '' || !query ) {
        filteredItems = parsedItems;
      } else {
        filteredItems = parsedItems.filter( ( item ) => matchQuery( item, query ) );
      }

      return filteredItems;
    },

    contains: function( rawItems, searchedItem = {} ) {
      if( !searchedItem.hasOwnProperty('id') && !searchedItem.hasOwnProperty('url') ) {
        return false;
      }

      const id  = searchedItem.id;
      const url = searchedItem.url;
      let parsedItems = parseItems( rawItems );

      return parsedItems.some( item => {
        let itemMatching = false;
        if( id  ) { itemMatching = itemMatching || item.id == id; }
        if( url ) { itemMatching = itemMatching || item.resolved_url == url; }

        return itemMatching;
      });
    },

    find: function( rawItems, searchedItem = {} ) {
      if( !searchedItem.hasOwnProperty('id') && !searchedItem.hasOwnProperty('url') ) {
        return null;
      }

      const id  = searchedItem.id;
      const url = searchedItem.url;
      let parsedItems = parseItems( rawItems );

      return parsedItems.find( item => {
        let itemMatching = false;
        if( id  ) { itemMatching = itemMatching || item.id == id; }
        if( url ) { itemMatching = itemMatching || item.resolved_url == url; }

        return itemMatching;
      });
    },

    // TODO: I call both filter and paginate most of the time...but for consistency, I should
    //       call paginate with raw items as well?
    paginate: function( parsedItems, page, perPage ) {
      const itemsCount = parsedItems.length;
      let sortedItems  = parsedItems.sort( ( a, b ) => a.created_at < b.created_at );

      if( !perPage || itemsCount == 0 ) {
        return sortedItems;
      }

      const pagesCount = Math.ceil( itemsCount / perPage );

      if( page <= 0 || page > pagesCount ) {
        Logger.warn( `Could not get page ${ page } (${ itemsCount } items, asked ${ perPage } per page)` );
      } else {
        const fromIndex = ( page - 1 ) * perPage;
        const toIndex   = ( page * perPage ) - 1;

        return sortedItems.slice( fromIndex, toIndex + 1 );
      }
    },

    // ---------------

    addItem: function( url, title, options = {} ) {
      Logger.log( '(Items.addItem)' );

      browser.storage.local.get([ 'access_token', 'items' ]).then( ({ access_token, items }) => {
        const alreadyContainsItem = Items.contains( items, { url: url } );
        if( alreadyContainsItem === true ) {
          // Instead of just logging, send an event back to the UI and exit
          browser.runtime.sendMessage({ notice: PocketNotice.ALREADY_IN_LIST });
          return;
        }

        new PocketApiRequester( access_token )
          .add( url, title )
          .then( response => {
            let parsedItems = Utility.parseJson( items ) || [];
            let newItem   = response.item;

            parsedItems.push({
              id:             newItem.item_id,
              resolved_title: title || newItem.title,
              resolved_url:   url,
              created_at:     ( Date.now()/1000 | 0 )
            });

            // Save item list in storage and update badge count
            browser.storage.local.set({ items: JSON.stringify( parsedItems ) });

            // Display an indicator on the badge that everything went well
            Badge.flashSuccess();

            // Send a message back to the UI
            browser.runtime.sendMessage({ action: 'added-item', id: newItem.item_id });

            // Close the given tab if setting closeTabWhenAdded is "on"
            if( options.closeTabId ) {
              Settings.init().then( () => {
                const closeTabWhenAdded = Settings.get('closeTabWhenAdded');
                if( closeTabWhenAdded ) {
                  setTimeout( () => {
                    browser.tabs.remove( options.closeTabId );
                  }, 200);
                }
              });
            }

            // Redraw every page pageAction
            Logger.log('(Items.addItem) new item has been added, we will update all matching pageActions');
            browser.tabs.query({ url: url }).then( function( tabs ) {
              for( const tab of tabs ) {
                Logger.log('(Items.addItem) will draw enabled page action for ' + tab.url );
                PageAction.drawEnabled( tab.id );
              }
            });
          })
          .catch( error => {
            Logger.error('(Items.addItem) Error while adding a new item');
            Logger.error(`(Items.addItem) ${ JSON.stringify(error) }`);
            Badge.flashError();
          });
      });
    },

    markAsRead : function( itemId ) {
      removeItem( itemId, 'archive' );
    },

    deleteItem: function( itemId ) {
      removeItem( itemId, 'delete' );
    }
  };
})();

export default Items;
