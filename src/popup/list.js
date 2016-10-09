
// --- EVENTS ---

let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current' );

retrieveItemsButton.addEventListener( 'click', function() {
  MainLoader.enable();
  chrome.runtime.sendMessage({ action: 'retrieve-items', force: true });
});

addCurrentPageButton.addEventListener( 'click', function() {
  MainLoader.enable();
  chrome.tabs.query({ active: true, currentWindow: true }, function ( tabs ) {
    let currentUrl = tabs[ 0 ].url;
    chrome.runtime.sendMessage({ action: 'add-item', url: currentUrl });
  });
});



var MainLoader = ( function() {
  let mainLoaderComponent = document.querySelector( '.main-loader' );

  return {
    enable: function() {
      mainLoaderComponent.classList.add('loading');
    },

    disable: function() {
      setTimeout( function() {
        mainLoaderComponent.classList.remove('loading');
      }, 2000);
    }
  };
})();


var UI = ( function() {
  function buildItemElement( item ) {
    let liElement    = document.createElement('li');
    let titleContent = document.createElement('span');
    let urlContent   = document.createElement('span');
    let tickElement  = document.createElement('div');
    let tickIconFont = document.createElement('i');
    let loadElement  = document.createElement('div');

    liElement.className    = 'item';
    titleContent.className = 'title';
    urlContent.className   = 'url';
    tickIconFont.classList.add( 'icon', 'icon-ok');
    tickElement.className  = 'tick';
    loadElement.classList.add( 'loader', 'hidden' );

    tickElement.addEventListener( 'click', function() {
      markAsRead( item.id );
    });

    tickElement.appendChild( tickIconFont );
    titleContent.appendChild( document.createTextNode( item.resolved_title ) );
    urlContent.appendChild( document.createTextNode( item.resolved_url ) );

    liElement.appendChild( tickElement );
    liElement.appendChild( loadElement );
    liElement.appendChild( titleContent );
    liElement.appendChild( document.createElement('br') );
    liElement.appendChild( urlContent );

    liElement.dataset.id = item.id;

    titleContent.addEventListener( 'click', function() { openLink( item.resolved_url ); });
    urlContent.addEventListener(   'click', function() { openLink( item.resolved_url ); });

    return liElement;
  }

  function openLink( url ) {
    browser.tabs.create({ url: url });
  }


  return {
    drawList: function( items ) {
      let container = document.querySelector( '.list-component' );
      container.innerHTML = '';

      for( let i = 0; i < items.length; i++) {
        let itemElement = buildItemElement( items[ i ] );
        container.appendChild( itemElement );
      }

      return;
    },

    setup: function() {
      isAuthenticated().then( function( access_token ) {
        document.querySelector( '.authentication' ).style.display = 'none';
        document.querySelector( '.authenticated'  ).style.display = 'block';

        // Display the currently available items
        browser.storage.local.get('items', function( data ) {
          if( data.items ) {
            itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
            UI.drawList( itemsList );
          }
        });

        // Update the list of items just in case
        chrome.runtime.sendMessage({ action: 'retrieve-items', force: false });
      }, function( error ) {
        let authenticationButton = document.querySelector( '.authentication button' );

        document.querySelector( '.authentication' ).style.display = 'block';
        document.querySelector( '.authenticated'  ).style.display = 'none';

        authenticationButton.addEventListener( 'click', function() {
          chrome.runtime.sendMessage({ action: 'authenticate' });
        });
      });
    },


    updateBadgeCount: function( items ) {
      chrome.browserAction.setBadgeBackgroundColor({ color: '#444' });

      if( items ) {
        chrome.browserAction.setBadgeText({ text: items.length.toString() });
      } else {
        chrome.browserAction.setBadgeText({ text: '' });
      }
    }
  };
})();



function markAsRead( itemId ) {
  document.querySelector( ".item[data-id='" + itemId + "'] .tick"   ).classList.add( 'hidden' );
  document.querySelector( ".item[data-id='" + itemId + "'] .loader" ).classList.remove( 'hidden' );

  chrome.runtime.sendMessage( { action: 'mark-as-read', id: itemId } );
}


// TODO This should be part of my Authentication module, but as of now, I can't find a way to
//      properly organize everything. If I use a separate file for Authentication, I don't know
//      how to require it from background.js, and if I put everything in background.js, then I need
//      to import it in my popup.html, and then the onMessage event listener gets triggered twice
//      for every message sent...
function isAuthenticated() {
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


// --------------------


document.addEventListener('DOMContentLoaded', function() {
  UI.setup();

  chrome.runtime.onMessage.addListener( function( eventData ) {
    if( eventData.error ) {
      MainLoader.disable();

      let errorContainer = document.querySelector( '.error-overlay' );
      let errorMessage = 'An error occurred: ';

      switch( eventData.error ) {
        case PocketError.UNREACHABLE:
          errorMessage += 'could not reach the server';
          break;
        case PocketError.UNAUTHORIZED:
          errorMessage += 'unauthorized, you might need to login again';
          break;
        case PocketError.PERMISSIONS:
          errorMessage += 'missing permissions';
          break;
        case PocketError.RATE_LIMIT:
          errorMessage += 'max number of requests reach for this hour';
          errorMessage += ' (reset in ' + eventData.resetDelay + ')';
          break;
      }

      errorContainer.innerHTML = errorMessage;
      errorContainer.classList.remove( 'hidden' );

      // Hide the error message after 5 seconds
      setTimeout( function() {
        errorContainer.classList.add( 'hidden' );
      }, 5000 );

    } else {

      switch( eventData.action ) {
        case 'authenticated':
          console.log('FXPOCKET | switch:authenticated');
          window.close();
          break;

        case 'marked-as-read':
          console.log('FXPOCKET | switch:marked-as-read');
          browser.storage.local.get('items', function( data ) {
            // TODO Extract to dedicated method
            document.querySelector( ".item[data-id='" + eventData.id + "']" ).classList.add( 'hidden' );
            UI.updateBadgeCount( JSON.parse( data.items ));
          });
          break;

        case 'added-item':
          console.log('FXPOCKET | switch:added-item');
          // TODO Just add a new item at the top of the list, and not redraw the whole list
          browser.storage.local.get('items', function( data ) {
            if( data.items ) {
              // TODO Extract to dedicated method
              itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
              UI.drawList( itemsList );
              UI.updateBadgeCount( itemsList );
            }
          });
          break;

        case 'retrieved-items':
          console.log('FXPOCKET | switch:retrieved-items');
          browser.storage.local.get('items', function( data ) {
            if( data.items ) {
              // TODO Extract to dedicated method
              itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
              UI.drawList( itemsList );
              UI.updateBadgeCount( itemsList );
            }
          });
          break;
      }

      MainLoader.disable();
    }
  });

});
