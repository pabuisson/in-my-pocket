
// --- EVENTS ---

let authenticationButton = document.querySelector( '.authentication button' );
let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current' );

// FOR DEBUG ONLY
let resetButton = document.querySelector( '.reset-list' );
resetButton.addEventListener('click', function() {
  browser.storage.local.remove([ 'last_retrieve', 'items' ]);
});
// ------------


authenticationButton.addEventListener( 'click', function() {
  chrome.runtime.sendMessage({ action: 'authenticate' });
});

retrieveItemsButton.addEventListener( 'click', function() {
  // TODO Display a spinner during the request
  chrome.runtime.sendMessage({ action: 'retrieve-items', force: true });
});

addCurrentPageButton.addEventListener( 'click', function() {
  // TODO Display a spinner during the request
  chrome.tabs.query({ active: true, currentWindow: true }, function ( tabs ) {
    let currentUrl = tabs[ 0 ].url;
    chrome.runtime.sendMessage({ action: 'add-item', url: currentUrl });
  });
});


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
  let loadElement  = document.createElement('div');

  liElement.className    = 'item';
  titleContent.className = 'title';
  urlContent.className   = 'url';
  tickElement.className  = 'tick';
  loadElement.classList.add( 'loader', 'hidden' );

  tickElement.addEventListener( 'click', function() {
    markAsRead( item.id );
  });

  tickElement.appendChild( document.createTextNode( '✔' ) );
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


chrome.runtime.onMessage.addListener( function( data ) {
  // TODO Check if status is OK or error
  // TODO Display a warning if there's an error
  switch( data.action ) {
    case 'marked-as-read':
      console.log('switch:marked-as-read');
      browser.storage.local.get('items', function( data ) {
        // TODO Extract to dedicated method
        document.querySelector( ".item[data-id='" + data.id + "']" ).classList.toggle( 'hidden' );
        updateBadgeCount( JSON.parse( data.items ));
      });
      break;

    case 'added-item':
      console.log('switch:added-item');
      // TODO Just add a new item at the top of the list, and not redraw the whole list
      browser.storage.local.get('items', function( data ) {
        if( data.items ) {
          itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
          drawList( itemsList );
          updateBadgeCount( itemsList );
        }
      });
      break;

    case 'retrieved-items':
      // TODO Check if status is OK or error
      // TODO Display a warning if there's an error
      console.log('switch:retrieved-items');
      browser.storage.local.get('items', function( data ) {
        if( data.items ) {
          itemsList = JSON.parse( data.items ).sort( function( a, b ) { return a.created_at < b.created_at; });
          drawList( itemsList );
          updateBadgeCount( itemsList );
        }
      });
      break;
  }

});
