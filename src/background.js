// TODO: Use a button in the popup to trigger the authentication process
// TODO: Avoid the loading of a given page (redirectIntermediate variable)


// TODO Replace this by an "internal" page with its own JS...
const redirectIntermediate = 'http://blog.pabuisson.com';
// var redirectIntermediate = chrome.extension.getURL('src/test.html');
const redirectAuthFinished = 'https://getpocket.com';
const consumerKey = '54622-1b67c0d0aa575fd165c31d2f';


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
}


chrome.runtime.onMessage.addListener( function( message ) {
  switch(message) {
    case 'authenticate':
      authenticate();
      break;
  }
});
