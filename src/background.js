
// --- AUTHENTICATION ---
// TODO: Avoid the loading of a given page (redirectIntermediate variable)
// TODO: Replace this by an "internal" page with its own JS...
const redirectIntermediate = 'http://oauth.pabuisson.com';
// var redirectIntermediate = chrome.extension.getURL('src/test.html');
const redirectAuthFinished = 'https://getpocket.com';
const consumerKey = '58817-addc87503598b7ed29e5bf72';


prepareRequest = function( url, action ) {
  var request = new XMLHttpRequest();

  if( url && ( action == 'GET' || action == 'POST' ) ) {
    request.open( action, url, true );
  }

  //Send the proper header information along with the request
  request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  request.setRequestHeader("X-Accept", "application/json");

  // There was a connection error of some sort
  request.onerror = function() {
    console.error('FXPOCKET | error while reaching the server!');
    console.error(request);
  };

  return request;
};


tabCallback = function( tabId, changeInfo, updatedTab ) {
  // callback url has been loaded
  if (changeInfo.status == 'complete' && updatedTab.url.indexOf(redirectIntermediate) === 0) {
    browser.tabs.remove( tabId );

    let request = prepareRequest( 'https://getpocket.com/v3/oauth/authorize', 'POST' );

    request.onload = function() {
      if( this.status >= 200 && this.status < 400) {
        const response = JSON.parse( this.response );
        const username = response.username;
        const access_token = response.access_token;

        // Store the access_token in local storage
        browser.storage.local.set({ access_token: access_token });
        browser.storage.local.set({ username: username });

        // Send a message back to the UI
        // TODO: Display something to the user?
        chrome.runtime.sendMessage({ action: 'authenticated' });
      }
    };

    browser.storage.local.get( 'requestToken', function( data ) {
      requestParams = JSON.stringify({ consumer_key: consumerKey, code: data.requestToken });
      request.send( requestParams );
    });
  }
};

authenticate = function() {
  let request = prepareRequest( 'https://getpocket.com/v3/oauth/request', 'POST' );

  request.onload = function() {
    if( this.status >= 200 && this.status < 400 ) {
      const response = JSON.parse( this.response );
      const requestToken = response.code;

      browser.storage.local.set({ requestToken: requestToken });

      const authorizeUrl = "https://getpocket.com/auth/authorize?request_token=" + requestToken + "&redirect_uri=" + redirectIntermediate;
      browser.tabs.create({ 'url': authorizeUrl }, function( tab ) {
        browser.tabs.onUpdated.addListener( tabCallback );
      });
    } else {
      // We reached our target server, but it returned an error
      console.error('FXPOCKET | server returned an error');
    }
  };

  requestParams = JSON.stringify( { consumer_key: consumerKey, redirect_uri: redirectAuthFinished } )
  request.send( requestParams );
};


isAuthenticated = function() {
  let promise = new Promise( function( resolve, reject ) {
    browser.storage.local.get('access_token').then( function(data) {
      if( 'access_token' in data ) {
        resolve( data.access_token );
      } else {
        reject();
      }
    });
  });

  return promise;
};



// --- API ACCESS ---


function retrieveItems( force ) {
  const intervalWithoutReload = 15*60;
  const currentTimestamp      = ( Date.now()/1000 | 0 );

  browser.storage.local.get([ 'items', 'last_retrieve' ], function( data ) {
    console.log( "FXPOCKET | interval without reload:  " + intervalWithoutReload );
    console.log( "FXPOCKET | interval since last sync: " + ( currentTimestamp - data.last_retrieve ));

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
    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST' );
    let requestParams = JSON.stringify( {
      consumer_key: consumerKey,
      access_token: data.access_token,
      detailType: 'simple'
    });

    request.onload = function() {
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);
        console.log(Object.keys(response.list).length + ' items in the response');

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
      }
    };

    request.send( requestParams );
  });
};

function retrieveDiff() {
  console.log('FXPOCKET | (retrieve diff)');

  browser.storage.local.get( ['access_token', 'last_retrieve', 'items'], function( data ) {
    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST' );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      detailType: 'simple',
      state: 'all',
      since: data.last_retrieve
    });

    request.onload = function() {
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);
        console.log(Object.keys(response.list).length + ' items in the response');

        let allItems = JSON.parse( data.items );
        console.log( 'FXPOCKET | items before: ' );
        console.log( allItems );

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

        console.log('FXPOCKET | ITEMS THAT WILL BE SAVED:');
        console.log(allItems);

        // Save item list in storage
        browser.storage.local.set({ items: JSON.stringify( allItems ) });

        // Update the last_retrieve timestamp in the database
        browser.storage.local.set({ last_retrieve: response.since });

        // Send a message back to the UI
        // TODO: Do this once in the "retrieveItems" method
        chrome.runtime.sendMessage({ action: 'retrieved-items' });
      }
    };

    request.send( requestParams );
  });
};


// TODO Be sure to url-encode the parameters you are sending. Otherwise if your url or title
//      have characters like ? or &, they will often break the request.
function addItem( url ) {
  console.log('FXPOCKET | (addItem)');

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let request = prepareRequest( 'https://getpocket.com/v3/add', 'POST' );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      url: url
    });

    request.onload = function() {
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);

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
      }
    };

    request.send( requestParams );
  });

}


function markAsRead( itemId ) {
  console.log('FXPOCKET | (markAsRead)');
  console.log('FXPOCKET | id to archive: ' + itemId );

  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let request = prepareRequest( 'https://getpocket.com/v3/send', 'POST' );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      actions: [
        { action: 'archive', item_id: itemId }
      ]
    });

    request.onload = function() {
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);

        // TODO: Is this the right way to know if a request went well?
        // TODO: If it is, I must use it in my other API request methods
        if( response.status ) {
          console.log('FXPOCKET | onload - itemId = ' + itemId );
          let items = JSON.parse( data.items );
          let removedItemIdx = items.findIndex( function( item ) { return item.id === itemId });

          if( removedItemIdx >= 0 ) {
            console.log('FXPOCKET | the item ' + itemId + ' has been found and removed');
            console.log('FXPOCKET | items that will be saved: ');
            console.log(items);

            items.splice( removedItemIdx, 1 );
            browser.storage.local.set({ items: JSON.stringify( items ) });
          }

          // Send a message back to the UI
          chrome.runtime.sendMessage({ action: 'marked-as-read', id: itemId });
        } else {
          console.error( 'FXPOCKET | Could not mark the item  ' + itemId + ' as read' );
        }
      }
    };

    request.send( requestParams );
  });
}


// --- MESSAGES ---

chrome.runtime.onMessage.addListener( function( eventData ) {
  switch( eventData.action ) {
    case 'authenticate':
      console.log("FXPOCKET | switch:authenticate");
      authenticate();
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
