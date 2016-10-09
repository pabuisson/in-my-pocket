
const consumerKey = '58817-addc87503598b7ed29e5bf72';


// --- API REQUEST HELPER ---

const PocketError = {
  GENERIC:      'generic',
  UNREACHABLE:  'unreachable',
  UNAUTHORIZED: 'unauthorized',
  PERMISSIONS:  'missing_permissions',
  RATE_LIMIT:   'user_rate_limit_reached'
};


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

      console.log(JSON.parse( this.response));
      if( successCallback ) {
        successCallback( JSON.parse( this.response ));
      }

    } else {
      errorObject.httpCode = this.status;

      switch( this.status ) {
        case 401:
          console.error('FXPOCKET | 401: unauthorized');
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
            console.error('FXPOCKET | 403: access_denied (rate limit)');
            console.error('FXPOCKET | 403: rate limit reset in ' + delayBeforeReset + ' seconds');
          } else {
            console.error('FXPOCKET | 403: access_denied (missing permissions)');
            errorObject.error = PocketError.PERMISSIONS;
          }
          break;
        case 404:
          console.error('FXPOCKET | 404: trying to reach a non-existing URL');
          errorObject.error = PocketError.UNREACHABLE;
          break;
        default:
          console.error('FXPOCKET | ' + this.status + ' ERROR');
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
    console.error('FXPOCKET | error while reaching the server');

    errorObject.httpCode = undefined
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

var Authentication = ( function() {
  // TODO Avoid the loading of a given page (redirectIntermediate variable)
  //      Replace by an "internal" page with its own JS
  const redirectIntermediate = 'http://oauth.pabuisson.com';
  const redirectAuthFinished = 'http://oauth.pabuisson.com';

  function tabCallback( tabId, changeInfo, updatedTab ) {
    // callback url has been loaded
    if (changeInfo.status == 'complete' && updatedTab.url.indexOf(redirectIntermediate) === 0) {
      browser.tabs.remove( tabId );

      onSuccess = function( response ) {
        const username = response.username;
        const access_token = response.access_token;

        // Store the access_token in local storage
        browser.storage.local.set({ access_token: access_token });
        browser.storage.local.set({ username: username });

        // Send a message back to the UI
        // TODO: Display something to the user?
        chrome.runtime.sendMessage({ action: 'authenticated' });
      };

      browser.storage.local.get( 'requestToken', function( data ) {
        let request = prepareRequest( 'https://getpocket.com/v3/oauth/authorize', 'POST', onSuccess );
        let requestParams = JSON.stringify({ consumer_key: consumerKey, code: data.requestToken });
        request.send( requestParams );
      });
    }
  }

  return {
    authenticate: function() {
      onSuccess = function( response ) {
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

  browser.storage.local.get([ 'items', 'last_retrieve' ], function( data ) {
    console.log( "FXPOCKET | retrieve items timeout: " + ( currentTimestamp - data.last_retrieve ) + ' / ' + intervalWithoutReload );

    if ( force || !data.items || !data.last_retrieve ) {
      // If force == true, we always reload the whole list
      retrieveFirst();
    } else if( currentTimestamp - data.last_retrieve > intervalWithoutReload ) {
      // If we already have sync, check if intervalWithoutReload is past, then we can reload
      retrieveDiff();
    }
  });
}

function retrieveFirst() {
  console.log('FXPOCKET | (retrieve first)');

  browser.storage.local.get('access_token', function( data ) {
    onSuccess = function( response ) {
      console.log(Object.keys( response.list ).length + ' items in the response');

      let itemsList = [];
      for( let itemId in response.list ) {
        let item = response.list[ itemId ];
        itemsList.push({
          id:             item.item_id,
          resolved_title: item.resolved_title,
          resolved_url:   item.resolved_url,
          created_at:     item.time_added
        });
      };

      // Save item list in storage
      browser.storage.local.set({ items: JSON.stringify(itemsList) });

      // Save timestamp into database as "last_retrieve", so that next time we just update the diff
      browser.storage.local.set({ last_retrieve: response.since });

      // Send a message back to the UI
      // TODO: Do this once in the "retrieveItems" method
      chrome.runtime.sendMessage({ action: 'retrieved-items' });
    };

    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST', onSuccess );
    let requestParams = JSON.stringify( {
      consumer_key: consumerKey,
      access_token: data.access_token,
      detailType: 'simple',
    });

    request.send( requestParams );
  });
};

function retrieveDiff() {
  console.log('FXPOCKET | (retrieve diff)');

  browser.storage.local.get( ['access_token', 'last_retrieve', 'items'], function( data ) {
    onSuccess = function( response ) {
      console.log(Object.keys(response.list).length + ' items in the response');
      let allItems = JSON.parse( data.items );

      // TODO: Extract this into a dedicated method
      for( let itemId in response.list ) {
        let item = response.list[ itemId ];

        switch( item.status ) {
          case '1':
          case '2':
            // Archived or deleted: we remove it from the items list
            console.log("FXPOCKET | NEED TO ARCHIVE: " + itemId + ' (' + item.resolved_title + ')' );
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
              console.log("FXPOCKET | ITEM " + itemId + "(" + item.resolved_title + ") ALREADY PRESENT, WILL BE UPDATED" );
              allItems[ itemIdx ] = Object.assign( allItems[ itemIdx ], {
                resolved_title: item.resolved_title,
                resolved_url:   item.resolved_url,
                created_at:     item.time_added
              });
            } else {
              // Item does not exist in the item list, we just add it
              console.log("FXPOCKET | NEED TO ADD: " + itemId + ' (' + item.resolved_title + ')' );
              allItems.push({
                id:             item.item_id,
                resolved_title: item.resolved_title,
                resolved_url:   item.resolved_url,
                created_at:     item.time_added
              });
            }
            break;
          default:
            console.log('FXPOCKET | STATUS UNKNOW, DONT KNOW HOW TO DEAL WITH THIS : ' + item.status );
            break;
        }
      }

      // Save item list in storage
      browser.storage.local.set({ items: JSON.stringify( allItems ) });

      // Update the last_retrieve timestamp in the database
      browser.storage.local.set({ last_retrieve: response.since });

      // Send a message back to the UI
      // TODO: Do this once in the "retrieveItems" method
      chrome.runtime.sendMessage({ action: 'retrieved-items' });
    };

    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST', onSuccess );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      detailType: 'simple',
      state: 'all',
      since: data.last_retrieve
    });

    request.send( requestParams );
  });
};


// TODO Be sure to url-encode the parameters you are sending. Otherwise if your url or title
//      have characters like ? or &, they will often break the request.
function addItem( url ) {
  console.log('FXPOCKET | (addItem)');

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    onSuccess = function( response ) {
      let itemsList = JSON.parse( data.items );
      let newItem   = response.item;
      itemsList.push({
        id:             newItem.item_id,
        resolved_title: newItem.title,
        resolved_url:   newItem.resolved_url || newItem.given_url,
        created_at:     ( Date.now()/1000 | 0 )
      });

      // Save item list in storage
      browser.storage.local.set({ items: JSON.stringify( itemsList ) });

      // Send a message back to the UI
      chrome.runtime.sendMessage({ action: 'added-item', id: newItem.item_id });
    };

    let request = prepareRequest( 'https://getpocket.com/v3/add', 'POST', onSuccess );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      url: url
    });

    request.send( requestParams );
  });

}

function markAsRead( itemId ) {
  console.log('FXPOCKET | (markAsRead)');
  console.log('FXPOCKET | id to archive: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    onSuccess = function( response ) {
      console.log('FXPOCKET | onload - itemId = ' + itemId );
      let items = JSON.parse( data.items );
      let removedItemIdx = items.findIndex( function( item ) { return item.id === itemId });

      if( removedItemIdx >= 0 ) {
        console.log('FXPOCKET | the item ' + itemId + ' has been found and removed');

        // Remove the archived item from the list
        items.splice( removedItemIdx, 1 );

        // Save edited item list in storage
        browser.storage.local.set({ items: JSON.stringify( items ) });
      }

      // Send a message back to the UI
      chrome.runtime.sendMessage({ action: 'marked-as-read', id: itemId });
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


// --- MESSAGES ---

chrome.runtime.onMessage.addListener( function( eventData ) {
  switch( eventData.action ) {
    case 'authenticate':
      console.log("FXPOCKET | switch:authenticate");
      Authentication.authenticate();
      break;
    case 'retrieve-items':
      console.log("FXPOCKET | switch:retrieve-items");
      retrieveItems( eventData.force );
      break;
    case 'add-item':
      console.log('FXPOCKET | switch:add-item');
      addItem( eventData.url );
      break;
    case 'mark-as-read':
      console.log('FXPOCKET | switch:mark-as-read');
      markAsRead( eventData.id );
      break;
  }
});
