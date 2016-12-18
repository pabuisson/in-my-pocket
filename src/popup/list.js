"use strict";

import Logger from '../modules/logger.js';
import Badge from '../modules/badge.js';


// --- EVENTS ---

let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current'  );
let filterItemsInput     = document.querySelector( '.filter-items' );
let placeholderNoResults = document.querySelector( '.search-no-results' );
let listComponent        = document.querySelector( '.list-component' );

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

filterItemsInput.addEventListener( 'keyup', function() {
  let query = this.value.toLowerCase();
  if( query !== '' ) {
    MainLoader.enable();
  }

  UI.drawList();
  MainLoader.disable( true );
});


var MainLoader = ( function() {
  let mainLoaderComponent = document.querySelector( '.main-loader' );

  return {
    enable: function() {
      mainLoaderComponent.classList.add('loading');
    },

    disable: function( instantly = true ) {
      let timeoutDuration = ( instantly ? 0 : 1000 );
      setTimeout( function() {
        mainLoaderComponent.classList.remove('loading');
      }, timeoutDuration );
    }
  };
})();

var UI = ( function() {
  function formatUrl( url ) {
    let replacedProtocols = [
      'http', 'https',
      'ftp',  'ftps'
    ].join('|');
    let replaceRegex = new RegExp( '(' + replacedProtocols + '):\/\/(www.){0,1}', 'gi' );

    return url.replace( replaceRegex, '' );
  }

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

    urlContent.appendChild( document.createTextNode( formatUrl( item.resolved_url ) ) );

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

    function focusSearchField() {
      setTimeout( function() {
        filterItemsInput.focus();
      }, 200 );
    }


  return {
    drawList: function() {
      browser.storage.local.get('items', function( data ) {
        let items           = data.items ? JSON.parse( data.items ) : [];
        let sortedItems     = items.sort( function( a, b ) { return a.created_at < b.created_at; });
        let itemsToRender   = undefined;
        let query           = document.querySelector( '.filter-items').value;

        // Filter item list
        if( query == '' || !query ) {
          itemsToRender = sortedItems;
          // In case, hides the "no item matching query" div, and display the list
          listComponent.classList.remove( 'hidden' );
          placeholderNoResults.classList.add( 'hidden' );
        } else {
          itemsToRender = sortedItems.filter( function( value, index ) {
            let title = value.resolved_title || '';
            let url   = value.resolved_url   || '';

            return title.toLowerCase().includes( query ) || url.toLowerCase().includes( query );
          });

          // Display the "no results" message or hide it
          if ( itemsToRender.length == 0 ) {
            listComponent.classList.add( 'hidden' );
            placeholderNoResults.classList.remove( 'hidden' );
          } else {
            listComponent.classList.remove( 'hidden' );
            placeholderNoResults.classList.add( 'hidden' );
          }
        }

        let container = document.querySelector( '.list-component' );
        container.innerHTML = '';

        for( let i = 0; i < itemsToRender.length; i++) {
          let itemElement = buildItemElement( itemsToRender[ i ] );
          container.appendChild( itemElement );
        }
      });

      return;
    },

    setup: function() {
      isAuthenticated().then( function( access_token ) {
        document.querySelector( '.authentication' ).style.display = 'none';
        document.querySelector( '.authenticated'  ).style.display = 'block';

        // Give focus to the input field
        focusSearchField();

        // Display the currently available items
        UI.drawList();

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
          Logger.log('list | switch:authenticated');
          window.close();
          chrome.runtime.sendMessage({ action: 'update-badge-count' });
          break;

        case 'marked-as-read':
          Logger.log('list | switch:marked-as-read');
          document.querySelector( ".item[data-id='" + eventData.id + "']" ).classList.add( 'hidden' );
          Badge.updateCount();
          break;

        case 'added-item':
          Logger.log('list | switch:added-item');
          UI.drawList();
          Badge.updateCount();
          break;

        case 'retrieved-items':
          Logger.log('list | switch:retrieved-items');
          UI.drawList();
          Badge.updateCount();
          break;
      }

      MainLoader.disable();
    }
  });

});
