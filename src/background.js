"use strict";

import { Request, RequestBuilder } from './modules/request_builder.js';
import Logger from './modules/logger.js';
import Settings from './modules/settings.js';
import Badge from './modules/badge.js';
import ContextMenu from './modules/context_menu.js';
import Authentication from './modules/authentication.js';
import Items from './modules/items.js';
import PageAction from './modules/page_action.js';
import { PocketNotice } from './modules/constants.js';

// - - -- - -- - -- - -- - -- - -- - -- - ---

const consumerKey = '58817-addc87503598b7ed29e5bf72';


// - - - AUTHENTICATION

// TODO: Move to the Authentication module
// TODO: After the opening of the callback tab, reactivate the tab where the
//      user was before for a less disturbing behaviour
var AuthenticationProcess = ( function() {
  // TODO: Avoid the loading of a given page (redirectIntermediate variable)
  //       Replace by an "internal" page with its own JS
  const redirectIntermediate = 'https://oauth.pabuisson.com';
  const redirectAuthFinished = 'https://oauth.pabuisson.com';

  function tabCallback( tabId, changeInfo, updatedTab ) {
    // callback url has been loaded
    if (changeInfo.status == 'complete' && updatedTab.url.indexOf(redirectIntermediate) === 0) {
      browser.tabs.remove( tabId );

      browser.storage.local.get( 'requestToken', function( { requestToken } ) {
        let requestParams = {
          consumer_key: consumerKey,
          code: requestToken
        };

        new Request( 'POST', 'https://getpocket.com/v3/oauth/authorize', requestParams )
          .fetch()
          .then( function( response ) {
            const username = response.username;
            const access_token = response.access_token;

            // Store the access_token in local storage
            browser.storage.local.set({ access_token: access_token });
            browser.storage.local.set({ username: username });

            // Send a message back to the UI
            chrome.runtime.sendMessage({ action: 'authenticated' });

            // Retrieve the items and update the badge count
            retrieveItems( true );

            // Create right click context menus
            ContextMenu.createEntries();
          });
      });
    }
  }

  return {
    authenticate: function() {
      let requestParams = {
        consumer_key: consumerKey,
        redirect_uri: redirectAuthFinished
      };

      new Request( 'POST', 'https://getpocket.com/v3/oauth/request', requestParams )
        .fetch()
        .then( function( response ) {
          const requestToken = response.code;

          browser.storage.local.set({ requestToken: requestToken });

          const authorizeUrl = "https://getpocket.com/auth/authorize?request_token=" + requestToken + "&redirect_uri=" + redirectIntermediate;
          browser.tabs.create({ 'url': authorizeUrl }, function( tab ) {
            browser.tabs.onUpdated.addListener( tabCallback );
          });
        });
    }
  };
})();



// - - - API ACCESS : LIST MANAGEMENT - - -

// TODO: export all those operations to a PocketAPI module
//       maybe they will be splitted (call to API to the Pocket API module,
//       the rest (callbacks) somewhere else -> a "Items" module ?)

function retrieveItems( force ) {
  const intervalWithoutReload = 15*60;
  const currentTimestamp      = ( Date.now()/1000 | 0 );

  browser.storage.local.get([ 'items', 'last_retrieve' ], function( { items, last_retrieve } ) {
    Logger.log( "retrieve items timeout: " + ( currentTimestamp - last_retrieve ) + ' / ' + intervalWithoutReload );

    if ( force || !items || !last_retrieve ) {
      // If force == true, we always reload the whole list
      retrieveFirst();
    } else if( currentTimestamp - last_retrieve > intervalWithoutReload ) {
      // If we already have sync, check if intervalWithoutReload is past, then we can reload
      retrieveDiff();
    } else {
      // Update the badge count, in case it wasn't displayed but no items reload happened
      Badge.updateCount();
    }
  });
}


// TODO: test with request class
function retrieveFirst() {
  Logger.log('(retrieve first)');

  browser.storage.local.get('access_token', function( { access_token } ) {
    let requestParams = {
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'simple',
    };

    new Request( 'POST', 'https://getpocket.com/v3/get', requestParams )
      .fetch()
      .then( function( response ) {
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
        };

        // Save item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( itemsList ) });
        Badge.updateCount( itemsList );

        // Save timestamp into database as "last_retrieve", so that next time we just update the diff
        browser.storage.local.set({ last_retrieve: response.since });

        // Send a message back to the UI
        // TODO: Do this once in the "retrieveItems" method
        chrome.runtime.sendMessage({ action: 'retrieved-items' });

        // Updates the tabs page actions
        PageAction.redrawAllTabs();
      });

  });
};


function retrieveDiff() {
  Logger.log('(retrieve diff)');

  browser.storage.local.get( ['access_token', 'last_retrieve', 'items'], function( { access_token, last_retrieve, items } ) {
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
        let allItems = JSON.parse( items );

        // TODO: Extract this into a dedicated method
        for( let itemId in response.list ) {
          let item = response.list[ itemId ];

          switch( item.status ) {
              // TODO: Create a constant somewhere instead of using magic numbers
            case '1':
            case '2':
              // Archived or deleted: we remove it from the items list
              Logger.log("NEED TO ARCHIVE: " + itemId + ' (' + item.resolved_title + ')' );
              let removedItemIdx = allItems.findIndex( function( item ) { return item.id === itemId });

              if( removedItemIdx >= 0 ) {
                allItems.splice( removedItemIdx, 1 );
              }

              break;

              // TODO: Create a constant somewhere instead of using magic numbers
            case '0':
              let itemIdx = allItems.findIndex( function( item ) { return item.id === itemId });

              if( itemIdx >= 0 ) {
                // Item already exists in the list (added by this current extension),
                // we just update the missing fields
                Logger.log("ITEM " + itemId + "(" + item.resolved_title + ") ALREADY PRESENT, WILL BE UPDATED" );
                allItems[ itemIdx ] = Object.assign( allItems[ itemIdx ], {
                  resolved_title: item.given_title || item.resolved_title,
                  resolved_url:   item.given_url || item.resolved_url,
                  created_at:     item.time_added
                });
              } else {
                // Item does not exist in the item list, we just add it
                Logger.log("NEED TO ADD: " + itemId + ' (' + item.resolved_title + ')' );
                allItems.push({
                  id:             item.item_id,
                  resolved_title: item.given_title || item.resolved_title,
                  resolved_url:   item.given_url || item.resolved_url,
                  created_at:     item.time_added
                });
              }
              break;

            default:
              Logger.log('STATUS UNKNOW, DONT KNOW HOW TO DEAL WITH THIS : ' + item.status );
              break;
          }
        }

        // Save item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( allItems ) });
        Badge.updateCount( allItems );

        // Update the last_retrieve timestamp in the database
        browser.storage.local.set({ last_retrieve: response.since });

        // Send a message back to the UI
        // TODO: Do this once in the "retrieveItems" method
        chrome.runtime.sendMessage({ action: 'retrieved-items' });

        // Updates the tabs page actions
        PageAction.redrawAllTabs();
      });
  });
};


// - - - API ACCESS : ITEMS ACTIONS - - -

// Dependencies:
//    -   Retrieve user access_token
//    -   Items storage : retrieve the already saved items
//    -   UI : push an item to the list
//    -   Items storage : add an item to all saved items
//    - ✓ Badge : flash the badge with a green check
//    -   PageAction : redraw the page action for tabs opened with this url
//    - ✓ ContextMenu : if current tab is the added item, change context menus states
//    -   Request : prepare and launch a request to the API

function addItem( url, title ) {
  Logger.log( '(addItem)' );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let itemsList = JSON.parse( data.items );
    // TODO: Move to helper
    let alreadyContainsItem = itemsList.some( function( item, index, array ) {
      return item.resolved_url == url;
    });

    if( alreadyContainsItem === true ) {
      // Instead of just logging, send an event back to the UI
      chrome.runtime.sendMessage( { notice: PocketNotice.ALREADY_IN_LIST } );

    } else if ( alreadyContainsItem === false ) {
      let requestParams = {
        consumer_key: consumerKey,
        access_token: data.access_token,
        url: url,
        title: title
      };

      new Request( 'POST', 'https://getpocket.com/v3/add',  requestParams )
        .fetch()
        .then( function( response ) {
          let itemsList = JSON.parse( data.items );
          let newItem   = response.item;

          itemsList.push({
            id:             newItem.item_id,
            resolved_title: title || newItem.title,
            resolved_url:   url,
            created_at:     ( Date.now()/1000 | 0 )
          });

          // Save item list in storage and update badge count
          browser.storage.local.set({ items: JSON.stringify( itemsList ) });

          // Display an indicator on the badge that everything went well
          Badge.flashSuccess();

          // Send a message back to the UI
          chrome.runtime.sendMessage({ action: 'added-item', id: newItem.item_id });

          // Redraw every page pageAction
          Logger.log('new item has been added, we will update all matching pageActions');
          browser.tabs.query( { url: url } ).then( function( tabs ) {
            for( const tab of tabs ) {
              Logger.log('will draw enabled page action for ' + tab.url );
              PageAction.drawEnabled( tab.id );
            }
          });

          // If current url is the one of the current tab, will update the available context menus
          ContextMenu.setCurrentPageState( url, ContextMenu.pageAlreadyInPocket );
        });
    }
  });
}


// NOTE: lots of code duplicate with "deleteItem" method
// Dependencies:
//    -   Retrieve user access_token
//    -   Items storage : retrieve the already saved items
//    - ✓ Badge : flash the badge with a green check
//    -   UI : remove an item from the list
//    -   Items storage : remove an item from all saved items
//    -   PageAction : redraw the page action for tabs opened with this url
//    - ✓ ContextMenu : if current tab is the removed item, change context menus states
//    -   Request : prepare and launch a request to the API
function markAsRead( itemId ) {
  Logger.log('(markAsRead)');
  Logger.log('id to archive: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let requestParams = {
      consumer_key: consumerKey,
      access_token: data.access_token,
      actions: [
        { action: 'archive', item_id: itemId }
      ]
    };

    new Request( 'POST', 'https://getpocket.com/v3/send', requestParams )
      .fetch()
      .then( function( response ) {
        Logger.log('onload - itemId = ' + itemId );
        let items = JSON.parse( data.items );
        let removedItemIdx = items.findIndex( function( item ) { return item.id === itemId });
        let removedItem = items[ removedItemIdx ];

        if( removedItemIdx >= 0 ) {
          Logger.log('the item ' + itemId + ' has been found and removed');

          // Remove the archived item from the list
          items.splice( removedItemIdx, 1 );

          // Save edited item list in storage
          browser.storage.local.set({ items: JSON.stringify( items ) });
          // Display an indicator on the badge that everything went well and update badge count
          Badge.flashSuccess();
        }

        // Send a message back to the UI
        chrome.runtime.sendMessage({ action: 'marked-as-read', id: itemId });

        // Redraw page actions
        if( removedItem ) {
          Logger.log('item has been removed, we will update all matching pageActions')
          browser.tabs.query( { url: removedItem.resolved_url } ).then( function( tabs ) {
            for( const tab of tabs ) {
              Logger.log('will draw disabled page action for ' + tab.url );
              PageAction.drawDisabled( tab.id );
            }
          });

          // If current url is the one of the current tab, will update the available context menus
          ContextMenu.setCurrentPageState( removedItem.resolved_url, ContextMenu.pageNotInPocket );
        }
      });
  });
}


// NOTE: lots of code duplicate with "markAsRead" method
// Dependencies:
//    -   Retrieve user access_token
//    -   Items storage : retrieve the already saved items
//    - ✓ Badge : flash the badge with a green check
//    -   UI : remove an item from the list
//    -   Items storage : remove an item from all saved items
//    -   PageAction : redraw the page action for tabs opened with this url
//    - ✓ ContextMenu : if current tab is the removed item, change context menus states
//    -   Request : prepare and launch a request to the API
function deleteItem( itemId ) {
  Logger.log('(deleteItem)');
  Logger.log('id to remove: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let requestParams = {
      consumer_key: consumerKey,
      access_token: data.access_token,
      actions: [
        { action: 'delete', item_id: itemId }
      ]
    };

    new Request( 'POST', 'https://getpocket.com/v3/send', requestParams )
      .fetch()
      .then( function( response ) {
        Logger.log('onload - itemId = ' + itemId );
        let items = JSON.parse( data.items );
        let removedItemIdx = items.findIndex( ( item ) => { return item.id === itemId } );
        let removedItem = items[ removedItemIdx ];

        if( removedItemIdx >= 0 ) {
          Logger.log('the item ' + itemId + ' has been found and removed');

          // Remove the archived item from the list
          items.splice( removedItemIdx, 1 );

          // Save edited item list in storage
          browser.storage.local.set({ items: JSON.stringify( items ) });
          // Display an indicator on the badge that everything went well and update badge count
          Badge.flashSuccess();
        }


        // Send a message back to the UI
        chrome.runtime.sendMessage({ action: 'deleted', id: itemId });

        // Redraw page actions
        if( removedItem ) {
          Logger.log('item has been removed, we will update all matching pageActions')
          browser.tabs.query( { url: removedItem.resolved_url } ).then( function( tabs ) {
            for( const tab of tabs ) {
              Logger.log('will draw disabled page action for ' + tab.url );
              PageAction.drawDisabled( tab.id );
            }
          });

          // If current url is the one of the current tab, will update the available context menus
          ContextMenu.setCurrentPageState( removedItem.resolved_url, ContextMenu.pageNotInPocket );
        }
      });
  });
}


// - - - OPEN ITEMS - - -

function openRandomItem( query, opt = {} ) {
  browser.storage.local.get( 'items' ).then( function( { items } ) {
    const parsedItems   = items ? JSON.parse( items ) : [];
    const filteredItems = Items.filter( parsedItems, query );

    if( filteredItems.length > 0 ) {
      const item = filteredItems[ Math.floor( Math.random() * filteredItems.length ) ];

      opt.url = item.resolved_url;
      openItem( opt );
    }
  });
}


function openItem( { newTab, url } ) {
  let pending;
  if( newTab == null ) {
    pending = Settings.init().then( function() {
      newTab = Settings.get( 'openInNewTab' );
    });
  } else {
    pending = Promise.resolve();
  }

  pending.then( function() {
    if( newTab ) {
      browser.tabs.create( { url } );
    } else {
      browser.tabs.update( { url } );
    }
  });
}



// - - - FEATURE : CONTEXT MENU - - -

browser.contextMenus.onClicked.addListener( function( link, tab ) {
  switch( link.menuItemId )
  {
    case ContextMenu.addId:
      if( link.linkUrl ) {
        addItem( link.linkUrl );
      } else {
        addItem( link.pageUrl, tab.title );
      }
      break;

    case ContextMenu.archiveId:
      browser.storage.local.get( "items" ).then( function( { items } ) {
        const parsedItems = JSON.parse( items );
        const item = parsedItems.find( i => i.resolved_url == tab.url );
        if( item ) {
          markAsRead( item.id );
        }
      });
      break;

    case ContextMenu.deleteId:
      browser.storage.local.get( "items" ).then( function( { items } ) {
        const parsedItems = JSON.parse( items );
        const item = parsedItems.find( i => i.resolved_url == tab.url );
        if( item ) {
          deleteItem( item.id );
        }
      });
      break;
  }
});


// - - - FEATURE : PAGE ACTION - - -

browser.pageAction.onClicked.addListener( function( tab ) {
  PageAction.toggle( tab, markAsRead, addItem );
});


// - - - HANDLE CONTEXT MENUS AND PAGE ACTION UPDATES - - -
// - - - On navigation, and on tab switch             - - -


// 1. When current tab url is changing
browser.tabs.onUpdated.addListener( function( tabId, changeInfo ) {
  if( changeInfo.hasOwnProperty('url') ) {
    browser.tabs.get( tabId ).then( ( tab ) => {
      // TODO: Maybe I can organize promises differently, so that I only access this handler
      //       when tab.active == true ? So I could remove one test / indentation level here
      if( tab.active ) {
        browser.storage.local.get( "items" ).then( ( { items } ) => {
          const parsedItems  = JSON.parse( items );
          const containsItem = parsedItems.some( i => i.resolved_url == tab.url );

          if( containsItem ) {
            Logger.log("current tab is loading " + changeInfo.url + " that IS in my list");
            // Context menu
            ContextMenu.setState( ContextMenu.pageAlreadyInPocket )
            // Page action
            PageAction.drawEnabled( tabId );
            PageAction.show( tabId );
          } else {
            Logger.log( "current tab is loading " + changeInfo.url + " that ISN'T in my list...yet");
            // Context menu
            ContextMenu.setState( ContextMenu.pageNotInPocket )
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
    browser.storage.local.get( "items" ).then( ( { items } ) => {
      const parsedItems  = JSON.parse( items );
      const containsItem = parsedItems.some( i => i.resolved_url == currentUrl );

      if( containsItem ) {
        Logger.log( "switching to a tab that IS in my list");
        // Context menu
        ContextMenu.setState( ContextMenu.pageAlreadyInPocket )
        // Page action
        PageAction.drawEnabled( tabId );
        PageAction.show( tabId );
      } else {
        Logger.log( "switching to a tab that ISN'T in my list...yet !");
        // Context menu
        ContextMenu.setState( ContextMenu.pageNotInPocket )
        // Page action
        PageAction.drawDisabled( tabId );
        PageAction.show( tabId );
      }
    });
  });
});




// - - - MESSAGES - - -

chrome.runtime.onMessage.addListener( function( eventData ) {
  Logger.log( `eventData.action:${eventData.action}` );
  switch( eventData.action ) {
    case 'authenticate':
      AuthenticationProcess.authenticate();
      break;
    case 'retrieve-items':
      retrieveItems( eventData.force );
      break;
    case 'add-item':
      addItem( eventData.url, eventData.title );
      break;
    case 'mark-as-read':
      markAsRead( eventData.id );
      break;
    case 'delete-item':
      deleteItem( eventData.id );
      break;
    case 'update-badge-count':
      Badge.updateCount();
      break;
    case 'random-item':
      openRandomItem( eventData.query );
      break;
    case 'read-item':
      openItem({ url: eventData.url });
      break;
    default:
      Logger.log( `Unknown action:${eventData.action}` );
  }
});


// - - - KEYBOARD SHORTCUTS - - -

browser.commands.onCommand.addListener( (command) => {
  if ( command === "toggle-page-status" ) {
    browser.tabs.query({ active: true }).then( ([ currentTab ]) => {
      const currentUrl = currentTab.url;
      const currentTitle = currentTab.title;

      browser.storage.local.get( 'items', ({ items }) => {
        const parsedItems = JSON.parse( items );
        const matchingItem = parsedItems.find( i => i.resolved_url == currentUrl );

        if( matchingItem ) {
          markAsRead( matchingItem.id );
        } else {
          addItem( currentUrl, currentTitle );
        }
      });
    });
  }
});


// - - - ON LOAD - - -

Authentication.isAuthenticated().then( function() {
  ContextMenu.createEntries();
  Badge.updateCount();
})
