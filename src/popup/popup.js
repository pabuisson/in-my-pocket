"use strict";

require( "file-loader?name=[path][name].[ext]!./popup.html" );
import'./popup.scss';

import Logger from '../modules/logger.js';
import Badge from '../modules/badge.js';
import Authentication from '../modules/authentication.js';
import Settings from '../modules/settings.js';
import Items from '../modules/items.js';
import { PocketError, PocketNotice } from '../modules/constants.js';


// --- EVENTS ---

let retrieveItemsButton  = document.querySelector( '.retrieve-items' );
let addCurrentPageButton = document.querySelector( '.add-current'  );
let readRandomItemButton = document.querySelector( '.random-item' );
let openSettingsButton   = document.querySelector( '.open-settings' );
let filterItemsInput     = document.querySelector( '.filter-items' );
let placeholderNoResults = document.querySelector( '.search-no-results' );
let listComponent        = document.querySelector( '.list-component' );


// - - - EVENT LISTENERS - - -

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

readRandomItemButton.addEventListener( 'click', () => {
  browser.runtime.sendMessage({
    action: 'random-item',
    query: filterItemsInput.value
  });
});

openSettingsButton.addEventListener( 'click', () => {
  // Close the popup in a setTimeout, otherwise the "openOptionsPage" part
  // has no valid "context" to be executed (and closing the popup in the promise
  // feels a lot slower)
  setTimeout( window.close, 100 );
  browser.runtime.openOptionsPage();
});

// TODO: debounce
filterItemsInput.addEventListener( 'keyup', function() {
  let query = this.value.toLowerCase();
  if( query !== '' ) {
    MainLoader.enable();
  }

  UI.drawList();
  MainLoader.disable( true );
});


// - - - OTHER MODULES - - -

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


var DomBuilder = ( function() {
  const ITEMS_PER_BATCH = 50;
  let itemsToCreate     = undefined;
  let totalItemsCount   = undefined;
  let createdItemsCount = undefined;
  let itemsContainer    = document.querySelector( '.list-component' );

  function areAllItemsBuilt() {
    const isInitialized    = totalItemsCount !== undefined && createdItemsCount !== undefined;
    const areAllItemsBuilt = createdItemsCount === totalItemsCount;

    return isInitialized && areAllItemsBuilt;
  }

  function formatUrl( url ) {
    let protocolsToRemove = [
      'http', 'https',
      'ftp',  'ftps'
    ].join('|');
    let removalRegex = new RegExp( '(' + protocolsToRemove + '):\/\/(www.){0,1}', 'gi' );

    return url.replace( removalRegex, '' );
  }

  function openLink( url ) {
    browser.runtime.sendMessage({action: 'read-item', url});
  }

  function resetUI() {
    itemsContainer.innerHTML = '';
  }

  // TODO: replace this with another mechanism (React ?)
  function buildItemElement( item ) {
    let liElement        = document.createElement('li');
    let titleContent     = document.createElement('span');
    let urlContent       = document.createElement('span');

    let actionContainer  = document.createElement('div');

    let tickAction       = document.createElement('div');
    let tickElement      = document.createElement('div');
    let tickIconFont     = document.createElement('i');
    let tickLoadElement  = document.createElement('div');

    let deleteAction     = document.createElement('div');
    let trashElement     = document.createElement('div');
    let trashIconFont    = document.createElement('i');
    let trashLoadElement = document.createElement('div');

    liElement.className    = 'item';
    titleContent.className = 'title';
    urlContent.className   = 'url';

    actionContainer.className = 'actions-container';

    tickAction.className = 'tick-action';
    tickIconFont.classList.add( 'icon', 'ion-checkmark' );
    tickElement.className  = 'tick';
    tickLoadElement.classList.add( 'loader', 'hidden' );

    deleteAction.className = 'delete-action';
    trashIconFont.classList.add( 'icon', 'ion-trash-b' );
    trashElement.className = 'trash';
    trashLoadElement.classList.add( 'loader', 'hidden' );

    tickAction.addEventListener( 'click', function() {
      UI.markAsRead( item.id );
    });

    deleteAction.addEventListener( 'click', function() {
      UI.deleteItem( item.id );
    });

    tickElement.appendChild( tickIconFont );
    trashElement.appendChild( trashIconFont );

    titleContent.appendChild( document.createTextNode( item.resolved_title ) );

    urlContent.appendChild( document.createTextNode( formatUrl( item.resolved_url ) ) );

    tickAction.appendChild( tickElement );
    tickAction.appendChild( tickLoadElement );

    deleteAction.appendChild( trashElement );
    deleteAction.appendChild( trashLoadElement );

    actionContainer.appendChild( tickAction );
    actionContainer.appendChild( deleteAction );

    liElement.appendChild( actionContainer );
    liElement.appendChild( titleContent );
    liElement.appendChild( document.createElement('br') );
    liElement.appendChild( urlContent );

    liElement.dataset.id = item.id;

    titleContent.addEventListener( 'click', function() { openLink( item.resolved_url ); });
    urlContent.addEventListener(   'click', function() { openLink( item.resolved_url ); });

    return liElement;
  }

  function buildBatch() {
    Logger.log('(build a new batch of items)');

    for( let i = 0; i < ITEMS_PER_BATCH; i++ ) {
      let itemToCreate = itemsToCreate[ createdItemsCount ];
      itemsContainer.appendChild( buildItemElement( itemToCreate ) );

      createdItemsCount++;

      // If we've built all items then get out of this loop
      if( areAllItemsBuilt() == true ) {
        Logger.log('All items are built');
        break;
      }
    }

    // if DOM is not all built yet, then ask for another animation frame where
    // we can keep on building the DOM
    if( areAllItemsBuilt() == false ) {
      Logger.log('Will request an animation frame for another run of the buildBatch method');
      requestAnimationFrame( buildBatch );
    }
  }

  return {
    buildAll: function( items ) {
      Logger.log('buildAll');

      // Reset list component content
      resetUI();

      // Prepare dom building
      itemsToCreate     = items;
      totalItemsCount   = items.length;
      createdItemsCount = 0;

      // Build the dom
      Logger.log('will request an animation frame for buildBatch method');
      requestAnimationFrame( buildBatch );
    }
  }
})();


var UI = ( function() {
  function focusSearchField() {
    setTimeout( function() {
      filterItemsInput.focus();
    }, 200 );
  }

  function setZoomLevel() {
    Settings.init().then( function() {
      let zoomLevel = Settings.get( 'zoomLevel' );
      document.documentElement.style.fontSize = zoomLevel;
    });
  }

  return {
    drawList: function() {
      browser.storage.local.get('items', function( { items } ) {
        const query       = filterItemsInput.value;
        let parsedItems   = items ? JSON.parse( items ) : [];
        let itemsToRender = Items.filter( parsedItems, query );

        // Display the "no results" message or hide it
        if( query == '' || !query || itemsToRender.length > 0 ) {
          listComponent.classList.remove( 'hidden' );
          placeholderNoResults.classList.add( 'hidden' );
        } else {
          listComponent.classList.add( 'hidden' );
          placeholderNoResults.classList.remove( 'hidden' );
        }

        // Rebuild all items
        DomBuilder.buildAll( itemsToRender );
      });

      return;
    },

    setup: function() {
      // Set default zoom level based on Settings
      setZoomLevel();

      Authentication.isAuthenticated().then( function( access_token ) {
        document.querySelector( '.authentication' ).style.display = 'none';
        document.querySelector( '.authenticated'  ).style.display = 'block';

        // Give focus to the input field
        focusSearchField();

        // Display the currently available items
        UI.drawList();

        // Enable the loading animation and update the list of items
        MainLoader.enable();
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


    markAsRead: ( itemId ) => {
      document.querySelector( ".item[data-id='" + itemId + "'] .tick-action .tick"   ).classList.add(    'hidden' );
      document.querySelector( ".item[data-id='" + itemId + "'] .tick-action .loader" ).classList.remove( 'hidden' );

      chrome.runtime.sendMessage( { action: 'mark-as-read', id: itemId } );
    },


    deleteItem: ( itemId ) => {
      document.querySelector( ".item[data-id='" + itemId + "'] .delete-action .trash"  ).classList.add(   'hidden' );
      document.querySelector( ".item[data-id='" + itemId + "'] .delete-action .loader" ).classList.remove( 'hidden' );

      chrome.runtime.sendMessage( { action: 'delete-item', id: itemId } );
    }
  };
})();





// - - - MAIN LOGIC LOOP - - -

// TODO: Split this in clearer components
// TODO: Maybe one component to create the message, one component to deal with UI creation
document.addEventListener('DOMContentLoaded', function() {
  UI.setup();

  chrome.runtime.onMessage.addListener( function( eventData ) {
    MainLoader.disable();

    if( eventData.error || eventData.notice ) {
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
      Logger.log( 'popup | switch:' + eventData.action );

      switch( eventData.action ) {
        case 'authenticated':
          window.close();
          chrome.runtime.sendMessage({ action: 'update-badge-count' });
          break;

        case 'marked-as-read':
          document.querySelector( ".item[data-id='" + eventData.id + "']" ).classList.add( 'disappearing' );
          Badge.updateCount();
          break;

        case 'deleted':
          document.querySelector( ".item[data-id='" + eventData.id + "']" ).classList.add( 'disappearing' );
          Badge.updateCount();
          break;

        case 'added-item':
          UI.drawList();
          Badge.updateCount();
          break;

        case 'retrieved-items':
          UI.drawList();
          Badge.updateCount();
          break;
      }
    }
  });
});
