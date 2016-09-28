

// --- AUTHENTICATION ---
// TODO: Avoid the loading of a given page (redirectIntermediate variable)

// TODO Replace this by an "internal" page with its own JS...
const redirectIntermediate = 'http://blog.pabuisson.com';
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
    console.error('error while reaching the server!');
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

        // TODO: Display something to the user?
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
      console.error('server returned an error');
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


function retrieveItems() {
  browser.storage.local.get([ 'items', 'last_retrieve' ], function( data ) {
    if ( data.items && data.last_retrieve ) {
      retrieveDiff();
    } else {
      retrieveFirst();
    }
  });
}


function retrieveFirst() {
  console.log('retrieve first');

  browser.storage.local.get('access_token', function( data ) {
    let request = prepareRequest( 'https://getpocket.com/v3/get', 'POST' );
    let requestParams = JSON.stringify( {
      consumer_key: consumerKey,
      access_token: data.access_token,
      detailType: 'simple'
    });

    request.onload = function() {
      console.log('got an answer');
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);

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
  console.log('retrieve diff');

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
      console.log('got an answer');
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);

        let allItems = JSON.parse( data.items );

        // TODO: Extract this into a dedicated method
        for( let itemId in response.list ) {
          let item = response.list[ itemId ];

          switch( item.status ) {
            case '1':
            case '2':
              // Archived or deleted: we remove it from the items list
              console.log("NEED TO ARCHIVE: " + item.resolved_title );
              removedItemIdx = allItems.findIndex( function( item ) { return item.id === itemId });
              allItems.splice( removedItemIdx );
              break;
            case '0':
              console.log("NEED TO ADD: " + item.resolved_title );
              // Added: we just add it to the list
              allItems.push({
                id:             item.item_id,
                resolved_title: item.resolved_title,
                resolved_url:   item.resolved_url,
                created_at:     item.time_added
              });
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
      }
    };

    request.send( requestParams );
  });
};


// TODO Be sure to url-encode the parameters you are sending. Otherwise if your url or title
//      have characters like ? or &, they will often break the request.
function addItem( url ) {
  browser.storage.local.get( [ 'access_token', 'items' ], function( data ) {
    let request = prepareRequest( 'https://getpocket.com/v3/add', 'POST' );
    let requestParams = JSON.stringify({
      consumer_key: consumerKey,
      access_token: data.access_token,
      url: url
    });

    request.onload = function() {
      console.log('got an answer (status = ' + this.status + ')');
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
      console.log('got an answer (status = ' + this.status + ')');
      if( this.status >= 200 && this.status < 400 ) {
        const response = JSON.parse( this.response );
        console.log(response);

        // TODO: Is this the right way to know if a request went well?
        // TODO: If it is, I must use it in my other API request methods
        if( response.status ) {
          items = JSON.parse( data.items );
          removedItemIdx = items.findIndex( function( item ) { return item.id === itemId });
          items.splice( removedItemIdx );
          browser.storage.local.set({ items: JSON.stringify( items ) });

          // Send a message back to the UI
          chrome.runtime.sendMessage({ action: 'marked-as-read', id: itemId });
        } else {
          console.error( 'Could not mark the item  ' + itemId + ' as read' );
        }
      }
    };

    request.send( requestParams );
  });
}


// --- MESSAGES ---

chrome.runtime.onMessage.addListener( function( data ) {
  switch( data.action ) {
    case 'authenticate':
      console.log("switch:authenticate");
      authenticate();
      break;
    case 'retrieve-items':
      console.log("switch:retrieve-items");
      retrieveItems();
      break;
    case 'add-item':
      console.log('switch:add-item');
      addItem( data.url );
      break;
    case 'mark-as-read':
      console.log('switch:mark-as-read');
      markAsRead( data.id );
      break;
  }
});
