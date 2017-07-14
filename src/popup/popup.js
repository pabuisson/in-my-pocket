"use strict";

require( "file-loader?name=[path][name].[ext]!./popup.html" );
import'./popup.scss';

import Logger from '../modules/logger.js';
import Badge from '../modules/badge.js';
import Authentication from '../modules/authentication.js';
import { PocketError, PocketNotice } from '../modules/constants.js';


// --- EVENTS ---

let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current'  );
let readRandomItemButton = document.querySelector( '.random-item' );
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
    let currentTitle = tabs[ 0 ].title;
    chrome.runtime.sendMessage({ action: 'add-item', url: currentUrl, title: currentTitle });
  });
});

readRandomItemButton.addEventListener( 'click', function() {
  browser.runtime.sendMessage({action: 'random-item'});
  // window.close();
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
    let actionContainer = document.createElement('div');
    let tickAction = document.createElement('div');
    let tickElement  = document.createElement('div');
    let tickIconFont = document.createElement('i');
    let loadElement  = document.createElement('div');

    liElement.className    = 'item';
    titleContent.className = 'title';
    urlContent.className   = 'url';
    actionContainer.className = 'actions-container';
    tickAction.className = 'tick-action';
    tickIconFont.classList.add( 'icon', 'icon-ok');
    tickElement.className  = 'tick';
    loadElement.classList.add( 'loader', 'hidden' );

    tickElement.addEventListener( 'click', function() {
      markAsRead( item.id );
    });

    tickElement.appendChild( tickIconFont );
    titleContent.appendChild( document.createTextNode( item.resolved_title ) );

    urlContent.appendChild( document.createTextNode( formatUrl( item.resolved_url ) ) );

    tickAction.appendChild( tickElement );
    tickAction.appendChild( loadElement );
    actionContainer.appendChild( tickAction );

    liElement.appendChild( actionContainer );
    liElement.appendChild( titleContent );
    liElement.appendChild( document.createElement('br') );
    liElement.appendChild( urlContent );

    liElement.dataset.id = item.id;

    titleContent.addEventListener( 'click', function() { openLink( item.resolved_url ); });
    urlContent.addEventListener(   'click', function() { openLink( item.resolved_url ); });

    return liElement;
  }

  function openLink( url ) {
    browser.runtime.sendMessage({action: 'read-item', url});
  }

    function focusSearchField() {
      setTimeout( function() {
        filterItemsInput.focus();
      }, 200 );
    }


  return {
    drawList: function() {
      browser.storage.local.get('items', function( { items } ) {
        let parsedItems     = items ? JSON.parse( items ) : [];
        let sortedItems     = parsedItems.sort( function( a, b ) { return a.created_at < b.created_at; });
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
      Authentication.isAuthenticated().then( function( access_token ) {
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


// --------------------


document.addEventListener('DOMContentLoaded', function() {
  UI.setup();

  chrome.runtime.onMessage.addListener( function( eventData ) {
    if( eventData.error || eventData.notice ) {
      MainLoader.disable();

      let flashContainer = document.querySelector( '.flash-overlay' );
      let flashMessage   = '';
      let errorClass     = 'error';
      let noticeClass    = 'notice';

      if( eventData.error ) {
        flashContainer.classList.add( errorClass );
        flashMessage = 'An error occurred: ';

        switch( eventData.error ) {
          case PocketError.UNREACHABLE:
            flashMessage += 'could not reach the server';
            break;
          case PocketError.UNAUTHORIZED:
            flashMessage += 'unauthorized, you might need to login again';
            break;
          case PocketError.PERMISSIONS:
            flashMessage += 'missing permissions';
            break;
          case PocketError.RATE_LIMIT:
            flashMessage += 'max number of requests reach for this hour';
            flashMessage += ' (reset in ' + eventData.resetDelay + ')';
            break;
        }
      } else if( eventData.notice ) {
        flashContainer.classList.add( noticeClass );

        switch( eventData.notice ) {
          case PocketNotice.ALREADY_IN_LIST:
            flashMessage = 'This page is already in your Pocket :)';
            break;
        }
      }

      flashContainer.innerHTML = flashMessage;
      flashContainer.classList.remove( 'hidden' );

      // Hide the error message after 5 seconds and reset the class list
      setTimeout( function() {
        flashContainer.classList.add( 'hidden' );
        flashContainer.classList.remove( errorClass, noticeClass );
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
