"use strict";

import Authentication from './modules/authentication.js';
import Badge from './modules/badge.js';
import ContextMenu from './modules/context_menu.js';
import Items from './modules/items.js';
import Logger from './modules/logger.js';
import PageAction from './modules/page_action.js';
import Request from './modules/request.js';
import Settings from './modules/settings.js';
import Utility from './modules/utility.js';
import { consumerKey } from './modules/constants.js';


// - - -- - -- - -- - -- - -- - -- - -- - ---

// - - - API ACCESS : LIST MANAGEMENT - - -

function retrieveItems( force ) {
  const intervalWithoutReload = 15*60;
  const currentTimestamp      = ( Date.now()/1000 | 0 );

  browser.storage.local.get([ 'items', 'last_retrieve' ]).then( ({ items, last_retrieve }) => {
    Logger.log( "(retrieveItems) timeout: " + ( currentTimestamp - last_retrieve ) + ' / ' + intervalWithoutReload );

    if ( force || !items || !last_retrieve ) {
      // If force == true, we always reload the whole list
      retrieveFirst();
    } else if( currentTimestamp - last_retrieve > intervalWithoutReload ) {
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


function retrieveFirst() {
  Logger.log('(retrieve first)');

  browser.storage.local.get('access_token').then( ({ access_token }) => {
    let requestParams = {
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'simple',
    };

    new Request( 'POST', 'https://getpocket.com/v3/get', requestParams )
      .fetch()
      .then( response => {
        Logger.log(Object.keys( response.list ).length + ' items in the response');

        let itemsList = [];
        for( let itemId in response.list ) {
          let item = response.list[ itemId ];

          // https://getpocket.com/developer/docs/v3/retrieve
          // given_url should be used if the user wants to view the item.
          itemsList.push({
            id:             item.item_id,
            resolved_title: item.given_title || item.resolved_title,
            resolved_url:   item.given_url || item.resolved_url,
            created_at:     item.time_added
          });
        }

        // Save item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( itemsList ) });
        Badge.updateCount( itemsList );

        // Save timestamp into database as "last_retrieve", so that next time we just update the diff
        // FIXME: use camelCase
        browser.storage.local.set({ last_retrieve: response.since });

        // Send a message back to the UI
        // TODO: Do this once in the "retrieveItems" method
        browser.runtime.sendMessage({ action: 'retrieved-items' });

        // Updates the tabs page actions
        PageAction.redrawAllTabs();
      })
      .catch( error => {
        Logger.warn('(bg.retrieveFirst) something went wrong...');
        Logger.warn(`(bg.retrieveFirst) ${ JSON.stringify(error) }`);
        Badge.flashError();
      });
  });
}


function retrieveDiff() {
  Logger.log('(bg.retrieveDiff)');

  const pocketApiStatus = {
    CREATED:  '0',
    ARCHIVED: '1',
    DELETED:  '2'
  };

  browser.storage.local.get(['access_token', 'last_retrieve', 'items']).then( ({ access_token, last_retrieve, items }) => {
    let requestParams = {
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'simple',
      state: 'all',
      since: last_retrieve
    };

    new Request( 'POST', 'https://getpocket.com/v3/get', requestParams )
      .fetch()
      .then( function( response ) {
        Logger.log(Object.keys(response.list).length + ' items in the response');
        let allItems = Utility.parseJson( items ) || [];

        // TODO: Extract this into a dedicated method
        for( let itemId in response.list ) {
          let item = response.list[ itemId ];

          switch( item.status ) {
            case pocketApiStatus.ARCHIVED:
            case pocketApiStatus.DELETED:
              // Archived or deleted: we remove it from the items list
              Logger.log("(bg.retriveDiff) NEED TO ARCHIVE: " + itemId + ' (' + item.resolved_title + ')' );
              let removedItemIdx = allItems.findIndex( item => item.id === itemId );

              if( removedItemIdx >= 0 ) {
                Logger.log('(bg.retrieveDiff) Item has been found and will be removed from the list');
                allItems.splice( removedItemIdx, 1 );
              } else {
                Logger.warn('(bg.retrieveDiff) Could not find the item to archive in the item lists');
              }

              break;

            case pocketApiStatus.CREATED:
              let itemIdx = allItems.findIndex( item => item.id === itemId );

              if( itemIdx >= 0 ) {
                // Item already exists in the list (added by this current extension),
                // we just update the missing fields
                Logger.log("(bg.retriveDiff) Item " + itemId + "(" + item.resolved_title + ") already present, will be updated" );
                allItems[ itemIdx ] = Object.assign( allItems[ itemIdx ], {
                  resolved_title: item.given_title || item.resolved_title,
                  resolved_url:   item.given_url || item.resolved_url,
                  created_at:     item.time_added
                });
              } else {
                // Item does not exist in the item list, we just add it
                Logger.log("(bg.retriveDiff) Add new item: " + itemId + ' (' + item.resolved_title + ')' );
                allItems.push({
                  id:             item.item_id,
                  resolved_title: item.given_title || item.resolved_title,
                  resolved_url:   item.given_url || item.resolved_url,
                  created_at:     item.time_added
                });
              }
              break;

            default:
              Logger.log('(bg.retriveDiff) Status unknow, dont know how to deal with this : ' + item.status );
              break;
          }
        }

        // Save item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( allItems ) });
        Badge.updateCount( allItems );

        // Update the last_retrieve timestamp in the database
        // TODO: if there were error, don't update the `last_retrieve` timestamp ? Would it play
        //       nicely with the items that were correctly removed/added?
        browser.storage.local.set({ last_retrieve: response.since });

        // Send a message back to the UI and updates the tabs page actions
        // TODO: Do this once in the "retrieveItems" method
        browser.runtime.sendMessage({ action: 'retrieved-items' });
        PageAction.redrawAllTabs();
      })
      .catch( error => {
        // Even if something went wrong while retrieving diff, we still can display the current
        // items, so we send the `retrieved-items` event back to popup to build the item list
        Logger.warn('(bg.retrieveDiff) something went wrong...');
        Logger.warn(`(bg.retrieveDiff) ${ JSON.stringify(error) }`);

        // Send a message back to the UI and updates the tabs page actions
        // TODO: Do this once in the "retrieveItems" method
        browser.runtime.sendMessage({ action: 'retrieved-items' });
        PageAction.redrawAllTabs();

        // Flash the badge if an error occured
        Badge.flashError();
      });
  });
}


// - - - OPEN ITEMS - - -

function openRandomItem( query, opt = {} ) {
  browser.storage.local.get( 'items' ).then( ({ items }) => {
    const filteredItems = Items.filter( items, query );

    if( filteredItems.length > 0 ) {
      const item = filteredItems[ Math.floor( Math.random() * filteredItems.length ) ];

      opt.itemId = item.id;
      openItem( opt );
    }
  });
}


function openItem( { itemId, openInNewTab } ) {
  let pending;
  let archiveWhenOpened = false;

  if( !openInNewTab ) {
    pending = Settings.init().then( () => {
      openInNewTab      = Settings.get( 'openInNewTab' );
      archiveWhenOpened = Settings.get( 'archiveWhenOpened' );
    });
  } else {
    pending = Promise.resolve();
  }

  pending.then( () => {
    browser.storage.local.get( 'items' ).then( ({ items }) => {
      const item = Items.find( items, { id: itemId } );

      if( openInNewTab ) {
        browser.tabs.create( { url: item.resolved_url } );
      } else {
        browser.tabs.update( { url: item.resolved_url } );
      }

      if( archiveWhenOpened ) {
        Items.markAsRead( item.id );
      }
    });
  });
}


// - - - MESSAGES - - -

browser.runtime.onMessage.addListener( function( eventData ) {
  Logger.log( `(bg.onMessage) eventData.action: ${eventData.action}` );
  switch( eventData.action ) {
    case 'authenticate':
      Authentication.authenticate().then( () => {
        // Send a message back to the UI
        browser.runtime.sendMessage({ action: 'authenticated' });
        // Retrieve the items and update the badge count
        retrieveItems( true );
        // Create right click context menus
        ContextMenu.createEntries();
      });
      break;
    case 'retrieve-items':
      retrieveItems( eventData.force );
      break;
    case 'add-item':
      const addItemOptions = { closeTabId: eventData.closeTabId };
      Items.addItem( eventData.url, eventData.title, addItemOptions );
      break;
    case 'mark-as-read':
      Items.markAsRead( eventData.id );
      break;
    case 'delete-item':
      Items.deleteItem( eventData.id );
      break;
    case 'update-badge-count':
      Badge.updateCount();
      break;
    case 'random-item':
      openRandomItem( eventData.query );
      break;
    case 'read-item':
      openItem({ itemId: eventData.itemId, openInNewTab: eventData.openInNewTab });
      break;
    case 'flash-error':
      Badge.flashError();
      break;
    default:
      Logger.log( `(bg.onMessage) Unknown action: ${eventData.action}` );
  }
});


// - - - ON LOAD - - -

Authentication.isAuthenticated().then( function() {
  ContextMenu.createEntries();
  Badge.updateCount();
});
