"use strict";

import Logger from './modules/logger.js';
import Settings from './modules/settings.js';
import Badge from './modules/badge.js';
import Authentication from './modules/authentication.js';
import Items from './modules/items.js';
import { PocketError, PocketNotice } from './modules/constants.js';

// --------------------------

const consumerKey = '58817-addc87503598b7ed29e5bf72';


// --- API REQUEST HELPER ---

function prepareRequest( url, action, successCallback, errorCallback ) {
  let request = new XMLHttpRequest();
  let errorObject = {
    httpCode: undefined,
    error:    undefined,
  };

  if( url && ( action == 'GET' || action == 'POST' ) ) {
    request.open( action, url, true );
  }

  //Send the proper header information along with the request
  request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  request.setRequestHeader("X-Accept", "application/json");

  request.onload = function() {
    if( this.status >= 200 && this.status < 400 ) {

      Logger.log(JSON.parse( this.response));
      if( successCallback ) {
        successCallback( JSON.parse( this.response ));
      }

    } else {
      errorObject.httpCode = this.status;

      switch( this.status ) {
        case 401:
          Logger.error('401: unauthorized');
          errorObject.error = PocketError.UNAUTHORIZED;
          // TODO: Reset data (items, access_token, etc.)
          // TODO: Re-triggers an authentication
          break;
        case 403:
          let userRemaining = this.getResponseHeader('X-Limit-User-Remaining');
          if( userRemaining && userRemaining == 0 ) {
            let delayBeforeReset = this.getResponseHeader('X-Limit-User-Reset');
            errorObject.error = PocketError.RATE_LIMIT;
            errorObject.resetDelay = delayBeforeReset;
            Logger.error('403: access_denied (rate limit)');
            Logger.error('403: rate limit reset in ' + delayBeforeReset + ' seconds');
          } else {
            Logger.error('403: access_denied (missing permissions)');
            errorObject.error = PocketError.PERMISSIONS;
          }
          break;
        case 404:
          Logger.error('404: trying to reach a non-existing URL');
          errorObject.error = PocketError.UNREACHABLE;
          break;
        default:
          Logger.error( this.status + ' ERROR');
          errorObject.error = PocketError.GENERIC;
          break;
      };

      // Instead of just logging, send an event back to the UI
      chrome.runtime.sendMessage( errorObject );

      if( errorCallback ) {
        errorCallback();
      }
    }
  };

  // There was a connection error of some sort
  request.onerror = function() {
    Logger.error('error while reaching the server');

    errorObject.httpCode = undefined;
    errorObject.error    = PocketError.UNREACHABLE;

    // Instead of just logging, send an event back to the UI
    chrome.runtime.sendMessage( errorObject )

    if( errorCallback ) {
      errorCallback();
    }
  };

  return request;
};


// --- AUTHENTICATION

// TODO After the opening of the callback tab, reactivate the tab where the
//      user was before for a less disturbing behaviour
var AuthenticationProcess = ( function() {
  // TODO Avoid the loading of a given page (redirectIntermediate variable)
  //      Replace by an "internal" page with its own JS
  const redirectIntermediate = 'https://oauth.pabuisson.com';
  const redirectAuthFinished = 'https://oauth.pabuisson.com';

  function tabCallback( tabId, changeInfo, updatedTab ) {
    // callback url has been loaded
    if (changeInfo.status == 'complete' && updatedTab.url.indexOf(redirectIntermediate) === 0) {
      browser.tabs.remove( tabId );

      let onSuccess = function( response ) {
        const username = response.username;
        const access_token = response.access_token;

        // Store the access_token in local storage
        browser.storage.local.set({ access_token: access_token });
        browser.storage.local.set({ username: username });

        // Send a message back to the UI
        // TODO: Display something to the user?
        chrome.runtime.sendMessage({ action: 'authenticated' });

        // Retrieve the items and update the badge count
        retrieveItems( true );
      };

      browser.storage.local.get( 'requestToken', function( { requestToken } ) {
        let request = prepareRequest( 'https://getpocket.com/v3/oauth/authorize', 'POST', onSuccess );
        let requestParams = JSON.stringify({ consumer_key: consumerKey, code: requestToken });
        request.send( requestParams );
      });
    }
  }

  return {
    authenticate: function() {
      let onSuccess = function( response ) {
        const requestToken = response.code;

        browser.storage.local.set({ requestToken: requestToken });

        const authorizeUrl = "https://getpocket.com/auth/authorize?request_token=" + requestToken + "&redirect_uri=" + redirectIntermediate;
        browser.tabs.create({ 'url': authorizeUrl }, function( tab ) {
          browser.tabs.onUpdated.addListener( tabCallback );
        });
      };

      let request = prepareRequest( 'https://getpocket.com/v3/oauth/request', 'POST', onSuccess );
      let requestParams = JSON.stringify( { consumer_key: consumerKey, redirect_uri: redirectAuthFinished } )
      request.send( requestParams );
    }
  };
})();



// --- API ACCESS ---

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


function retrieveFirst() {
  Logger.log('(retrieve first)');

  browser.storage.local.get('access_token', function( { access_token } ) {
    let onSuccess = function( response ) {
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
      browser.storage.local.set({ items: JSON.stringify(itemsList) });
      Badge.updateCount( itemsList );

      // Save timestamp into database as "last_retrieve", so that next time we just update the diff
      browser.storage.local.set({ last_retrieve: response.since });

      // Send a message back to the UI
      // TODO: Do this once in the "retrieveItems" method
      chrome.runtime.sendMessage({ action: 'retrieved-items' });

      // Updates the tabs page actions
      redrawPageActionAllTabs();
    };

    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST', onSuccess );
    let requestParams = JSON.stringify( {
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'simple',
    });

    request.send( requestParams );
  });
};


function retrieveDiff() {
  Logger.log('(retrieve diff)');

  browser.storage.local.get( ['access_token', 'last_retrieve', 'items'], function( { access_token, last_retrieve, items } ) {
    let onSuccess = function( response ) {
      Logger.log(Object.keys(response.list).length + ' items in the response');
      let allItems = JSON.parse( items );

      // TODO: Extract this into a dedicated method
      for( let itemId in response.list ) {
        let item = response.list[ itemId ];

        switch( item.status ) {
          case '1':
          case '2':
            // Archived or deleted: we remove it from the items list
            Logger.log("NEED TO ARCHIVE: " + itemId + ' (' + item.resolved_title + ')' );
            let removedItemIdx = allItems.findIndex( function( item ) { return item.id === itemId });

            if( removedItemIdx >= 0 ) {
              allItems.splice( removedItemIdx, 1 );
            }

            break;
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
      redrawPageActionAllTabs();
    };

    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST', onSuccess );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: access_token,
      detailType: 'simple',
      state: 'all',
      since: last_retrieve
    });

    request.send( requestParams );
  });
};


// TODO Be sure to url-encode the parameters you are sending. Otherwise if your url or title
//      have characters like ? or &, they will often break the request.
function addItem( url, title ) {
  Logger.log('(addItem)');

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let onSuccess = function( response ) {
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
      // TODO: This may be moved to the Badge module
      browser.browserAction.setBadgeText({ text: '✓' });
      browser.browserAction.setBadgeBackgroundColor({ color: '#50bcb6' });

      // Then restore the badge count according to settings and send message back to the UI
      setTimeout( function() {
        // Update the badge if needed
        Badge.updateCount( itemsList );

        // Send a message back to the UI
        chrome.runtime.sendMessage({ action: 'added-item', id: newItem.item_id });
      }, 2500);

      browser.tabs.query( { url: url } ).then( function( tabs ) {
        for( const tab of tabs ) {
          redrawPageAction( tab.id, tab.url );
        }
      });
    };


    let itemsList = JSON.parse( data.items );
    let alreadyContainsItem = itemsList.some( function( item, index, array ) {
      return item.resolved_url == url;
    });

    if( alreadyContainsItem === true ) {
      // Instead of just logging, send an event back to the UI
      chrome.runtime.sendMessage( { notice: PocketNotice.ALREADY_IN_LIST } );
    } else if ( alreadyContainsItem === false ) {
      let request = prepareRequest( 'https://getpocket.com/v3/add', 'POST', onSuccess );
      let requestParams = JSON.stringify({
        consumer_key: consumerKey,
        access_token: data.access_token,
        url: url,
        title: title
      });

      request.send( requestParams );
    }
  });
}



// NOTE: lots of code duplicate with "deleteItem" method
function markAsRead( itemId ) {
  Logger.log('(markAsRead)');
  Logger.log('id to archive: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let onSuccess = function( response ) {
      Logger.log('onload - itemId = ' + itemId );
      let items = JSON.parse( data.items );
      let removedItemIdx = items.findIndex( function( item ) { return item.id === itemId });
      let removedItem = items[ removedItemIdx ];

      if( removedItemIdx >= 0 ) {
        Logger.log('the item ' + itemId + ' has been found and removed');

        // Remove the archived item from the list
        items.splice( removedItemIdx, 1 );

        // Save edited item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( items ) });
        Badge.updateCount( items );
      }

      // Send a message back to the UI
      chrome.runtime.sendMessage({ action: 'marked-as-read', id: itemId });

      // Redraw page action
      if( removedItem ) {
        browser.tabs.query( { url: removedItem.resolved_url } ).then( function( tabs ) {
          for( const tab of tabs ) {
            redrawPageAction( tab.id, tab.url );
          }
        });
      }
    };

    let request = prepareRequest( 'https://getpocket.com/v3/send', 'POST', onSuccess );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      actions: [
        { action: 'archive', item_id: itemId }
      ]
    });

    request.send( requestParams );
  });
}


// NOTE: lots of code duplicate with "markAsRead" method
function deleteItem( itemId ) {
  Logger.log('(deleteItem)');
  Logger.log('id to remove: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let onSuccess = function( response ) {
      Logger.log('onload - itemId = ' + itemId );
      let items = JSON.parse( data.items );
      let removedItemIdx = items.findIndex( ( item ) => { return item.id === itemId } );
      let removedItem = items[ removedItemIdx ];

      if( removedItemIdx >= 0 ) {
        Logger.log('the item ' + itemId + ' has been found and removed');

        // Remove the archived item from the list
        items.splice( removedItemIdx, 1 );

        // Save edited item list in storage and update badge count
        browser.storage.local.set({ items: JSON.stringify( items ) });
        Badge.updateCount( items );
      }

      // Send a message back to the UI
      chrome.runtime.sendMessage({ action: 'deleted', id: itemId });

      // Redraw page action
      if( removedItem ) {
        browser.tabs.query( { url: removedItem.resolved_url } ).then( function( tabs ) {
          for( const tab of tabs ) {
            redrawPageAction( tab.id, tab.url );
          }
        });
      }
    };

    let request = prepareRequest( 'https://getpocket.com/v3/send', 'POST', onSuccess );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      actions: [
        { action: 'delete', item_id: itemId }
      ]
    });

    request.send( requestParams );
  });
}


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

const addLinkId = 'add-link-to-pocket';

chrome.contextMenus.create({
  id: addLinkId,
  title: 'Add to Pocket',
  contexts: ['link', 'page']
});


browser.contextMenus.onClicked.addListener( function( link, tab ) {
  if( link.menuItemId == addLinkId ) {
    if( link.linkUrl ) {
      addItem( link.linkUrl );
    } else {
      addItem( link.pageUrl, tab.title );
    }
  }
});


// - - - FEATURE : PAGE ACTION - - -

browser.tabs.onUpdated.addListener( function( tabId, changeInfo ) {
  if( changeInfo.url ) {
    redrawPageAction( tabId, changeInfo.url );
  }
});

browser.pageAction.onClicked.addListener( function( tab ) {
  togglePageAction( tab );
});


function redrawPageAction( tabId, url ) {
  browser.storage.local.get( "items" ).then( function( { items } ) {
    const parsedItems = JSON.parse( items );
    if( parsedItems.some( i => i.resolved_url == url ) ) {
      // item is in pocket
      browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-blue.svg" });
      browser.pageAction.setTitle({ tabId, title: "Mark as read" });
    } else {
      browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-grey.svg" });
      browser.pageAction.setTitle({ tabId, title: "Add to pocket" });
    }
    showPageAction(tabId);
  });
}

function redrawPageActionAllTabs() {
  browser.tabs.query( {} ).then( function( tabs ) {
    for( const tab of tabs ) {
      if( tab.url ) {
        redrawPageAction( tab.id, tab.url );
      }
    }
  });
}

function showPageAction( tabId ) {
  browser.pageAction.show( tabId );
}

function togglePageAction( tab ) {
  browser.storage.local.get( "items" ).then( function( { items } ) {
    const parsedItems = JSON.parse( items );
    const item = parsedItems.find( i => i.resolved_url == tab.url );
    if( item ) {
      // in pocket
      markAsRead( item.id );
    } else {
      addItem( tab.url, tab.title );
    }
  });
}



// --- MESSAGES ---

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


// --- KEYBOARD SHORTCUTS ---

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


// --- ON LOAD ---

Authentication.isAuthenticated().then( function() {
  Badge.updateCount();
})

