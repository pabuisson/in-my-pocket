
// --- EVENTS ---

let authenticationButton = document.querySelector( '.authentication button' );
let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current' );
let mainLoaderComponent  = document.querySelector( '.main-loader' );

// ------------

authenticationButton.addEventListener( 'click', function() {
  chrome.runtime.sendMessage({ action: 'authenticate' });
});

retrieveItemsButton.addEventListener( 'click', function() {
  enableMainLoader();
  chrome.runtime.sendMessage({ action: 'retrieve-items', force: true });
});

addCurrentPageButton.addEventListener( 'click', function() {
  enableMainLoader();
  chrome.tabs.query({ active: true, currentWindow: true }, function ( tabs ) {
    let currentUrl = tabs[ 0 ].url;
    chrome.runtime.sendMessage({ action: 'add-item', url: currentUrl });
  });
});


function enableMainLoader() {
  mainLoaderComponent.classList.add('loading');
}

function disableMainLoader() {
  setTimeout( function() {
    mainLoaderComponent.classList.remove('loading');
  }, 2000);
}


// ----------------------

function setupUI() {
  isAuthenticated().then( function( access_token ) {
    document.querySelector( '.authentication' ).style.display = 'none';
    document.querySelector( '.authenticated'  ).style.display = 'block';

    // Display the currently available items
    browser.storage.local.get('items', function( data ) {
      if( data.items ) {
        itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
        drawList( itemsList );
      }
    });

    // Update the list of items just in case
    chrome.runtime.sendMessage({ action: 'retrieve-items', force: false });
  }, function( error ) {
    document.querySelector( '.authentication' ).style.display = 'block';
    document.querySelector( '.authenticated'  ).style.display = 'none';
  });
};


/* Build list item:
 *
 * <li>
 *  <div> ✓ </div>
 *  <span> title </span>
 *  <span> url </span>
 * </li>
 */
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
};


function drawList( items ) {
  let container = document.querySelector( '.list-component' );

  container.innerHTML = '';

  for( let i = 0; i < items.length; i++) {
    let itemElement = buildItemElement( items[ i ] );
    container.appendChild( itemElement );
  }

  return;
}


function updateBadgeCount( items ) {
  chrome.browserAction.setBadgeBackgroundColor({ color: '#444' });

  if( items ) {
    chrome.browserAction.setBadgeText({ text: items.length.toString() });
  } else {
    chrome.browserAction.setBadgeText({ text: '' });
  }
}


function openLink( url ) {
  browser.tabs.create({ url: url });
}


// TODO Directly call markAsRead method from where it's defined, and make it return a promise
//      so that I can easily update my UI when it's successfully done
function markAsRead( itemId ) {
  document.querySelector( ".item[data-id='" + itemId + "'] .tick"   ).classList.add( 'hidden' );
  document.querySelector( ".item[data-id='" + itemId + "'] .loader" ).classList.remove( 'hidden' );

  chrome.runtime.sendMessage( { action: 'mark-as-read', id: itemId } );
}


// --------------------

document.addEventListener('DOMContentLoaded', function() {
  setupUI();
});


chrome.runtime.onMessage.addListener( function( eventData ) {
  if( eventData.error ) {

    disableMainLoader();

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
          document.querySelector( ".item[data-id='" + eventData.id + "']" ).classList.toggle( 'hidden' );
          updateBadgeCount( JSON.parse( data.items ));
          disableMainLoader();
        });
        break;

      case 'added-item':
        console.log('FXPOCKET | switch:added-item');
        // TODO Just add a new item at the top of the list, and not redraw the whole list
        browser.storage.local.get('items', function( data ) {
          if( data.items ) {
            // TODO Extract to dedicated method
            itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
            drawList( itemsList );
            updateBadgeCount( itemsList );
          }
          disableMainLoader();
        });
        break;

      case 'retrieved-items':
        console.log('FXPOCKET | switch:retrieved-items');
        browser.storage.local.get('items', function( data ) {
          if( data.items ) {
            // TODO Extract to dedicated method
            itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
            drawList( itemsList );
            updateBadgeCount( itemsList );
          }
          disableMainLoader();
        });
        break;
    }
  }
});
