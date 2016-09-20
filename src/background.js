// TODO Replace this by an "internal" page with its own JS...
// var redirectIntermediate = chrome.extension.getURL('src/test.html');
var redirectIntermediate = 'http://blog.pabuisson.com';
var redirectAuthFinished = 'https://getpocket.com';
var consumerKey = '54622-1b67c0d0aa575fd165c31d2f';
var requestToken = undefined;


tabCallback = function( tabId, changeInfo, updatedTab ) {
  // callback url has been loaded
  if (changeInfo.status == 'complete' && updatedTab.url.indexOf(redirectIntermediate) === 0) {
    browser.tabs.remove( tabId );

    var request = new XMLHttpRequest();
    request.open('POST', 'https://getpocket.com/v3/oauth/authorize', true);

    //Send the proper header information along with the request
    request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    request.setRequestHeader("X-Accept", "application/json");

    request.onload = function() {
      console.log('request 2 onload');
      if( this.status >= 200 && this.status < 400) {
        var response = JSON.parse( this.response );
        var username = response.username;
        var access_token = response.access_token;

        console.log(`username: ${ username } // access_token: ${ access_token }`);
        // TODO: Store the access_token somewhere
        // NOTE: Need the access_token + consumer_key for further requests
        // TODO: Display something to the user?
      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
      console.error('error while reaching the server!');
      console.error(request);
    };

    request.send(JSON.stringify({ consumer_key: consumerKey, code: requestToken }));
  }
};

obtainConsumerKey = function() {
  var request = new XMLHttpRequest();
  request.open('POST', 'https://getpocket.com/v3/oauth/request', true);

  //Send the proper header information along with the request
  request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  request.setRequestHeader("X-Accept", "application/json");

  request.onload = function() {
    if( this.status >= 200 && this.status < 400 ) {
      // Success!
      var response = JSON.parse( this.response );
      requestToken = response.code;

      var authorizeUrl = "https://getpocket.com/auth/authorize?request_token=" + requestToken + "&redirect_uri=" + redirectIntermediate;
      browser.tabs.create({ 'url': authorizeUrl }, function( tab ) {
        browser.tabs.onUpdated.addListener( tabCallback );
      });
    } else {
      // We reached our target server, but it returned an error
      console.error('server returned an error');
    }
  };

  request.onerror = function() {
    // There was a connection error of some sort
    console.error('error while reaching the server!');
    console.error(request);
  };

  request.send(JSON.stringify({ consumer_key: consumerKey, redirect_uri: redirectAuthFinished }));
};


console.log('--- background.js ----');
obtainConsumerKey();

