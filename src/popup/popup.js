"use strict";

require( "file-loader?name=[path][name].[ext]!./popup.html" );
import'./popup.scss';

import Logger from '../modules/logger.js';
import Badge from '../modules/badge.js';
import Authentication from '../modules/authentication.js';
import Settings from '../modules/settings.js';
import Items from '../modules/items.js';
import { PocketError, PocketNotice, MouseButtons } from '../modules/constants.js';
import Utility from '../modules/utility.js';


// --- EVENTS ---

let retrieveItemsButton          = document.querySelector( '.retrieve-items' );
let addCurrentPageButton         = document.querySelector( '.add-current'  );
let readRandomItemButton         = document.querySelector( '.random-item' );
let openSettingsButton           = document.querySelector( '.open-settings' );
let filterItemsInput             = document.querySelector( '.filter-items' );
let clearSearchBoxButton         = document.querySelector( '.clear-search-box');
let placeholderNoResults         = document.querySelector( '.search-no-results' );
let listComponent                = document.querySelector( '.list-component' );
let paginationContainer          = document.querySelector( '.pagination' );
let paginationPageSelector       = document.querySelector( '.pagination-page-selector' );
let paginationPreviousPageButton = document.querySelector( '.pagination-previous');
let paginationNextPageButton     = document.querySelector( '.pagination-next');

// prevent general.autoScroll
document.body.onmousedown = ( e ) => {
  if (e.button === MouseButtons.MIDDLE )
    return false;
};


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

clearSearchBoxButton.addEventListener('click', () => {
  filterItemsInput.value = '';
  debouncedFilterEventHandler.apply(filterItemsInput);
  UI.focusSearchField();
});

let debouncedFilterEventHandler = Utility.debounce( function() {
  let query = this.value.toLowerCase();
  if( query !== '' ) {
    MainLoader.enable();
    clearSearchBoxButton.classList.remove('hidden');
  } else {
    clearSearchBoxButton.classList.add('hidden');
  }

  // Save query to localStorage 'display' variable
  browser.storage.local.get( 'display', ({ display }) => {
    const parsedDisplay  = Utility.parseJson( display ) || {};
    const displayOptions = Object.assign( {}, parsedDisplay, { query: query });
    browser.storage.local.set( { display: JSON.stringify( displayOptions ) } );
  });

  // Draw the items lists
  Logger.log('(debouncedFilterEventHandler) will draw list with query=' + query);
  UI.drawList({ page: 1, query: query });
  MainLoader.disable( true );
}, 200 );

filterItemsInput.addEventListener( 'keyup', debouncedFilterEventHandler );


function previousPageEventListener() {
  browser.storage.local.get( 'display', ({ display }) => {
    const parsedDisplay  = Utility.parseJson( display ) || {};
    const currentPage = display ? parsedDisplay.currentPage : 1;

    Logger.log(`Load previous page: from ${ currentPage } to ${ currentPage - 1 }`);
    UI.drawList({ page: currentPage - 1 });
  });
}

function nextPageEventListener() {
  browser.storage.local.get( 'display', ({ display }) => {
    const parsedDisplay  = Utility.parseJson( display ) || {};
    const currentPage = display ? parsedDisplay.currentPage : 1;

    Logger.log(`Load next page: from ${ currentPage } to ${ currentPage + 1 }`);
    UI.drawList({ page: currentPage + 1 });
  });
}

function changePageEventListener( event ) {
  let pageToLoad = parseInt( event.target.value );

  Logger.log(`Load page ${ pageToLoad }`);
  UI.drawList({ page: pageToLoad });
}

paginationPreviousPageButton.addEventListener( 'click', previousPageEventListener );
paginationNextPageButton.addEventListener( 'click', nextPageEventListener );
paginationPageSelector.addEventListener( 'change', changePageEventListener );


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

// TODO: maybe I'll remove this once I'll have a pagination working
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

  function faviconUrl( url ) {
    return "http://www.google.com/s2/favicons?domain_url=" + encodeURIComponent(url);
  }

  function formatUrl( url ) {
    let protocolsToRemove = [
      'http', 'https',
      'ftp',  'ftps'
    ].join('|');
    let removalRegex = new RegExp( '(' + protocolsToRemove + '):\/\/(www.){0,1}', 'gi' );

    return url.replace( removalRegex, '' );
  }

  // openInNewTab param allows us to force the behaviour (ctrl-click or middle-click)
  function openLink( itemId, openInNewTab = false ) {
    browser.runtime.sendMessage({ action: 'read-item', itemId: itemId, openInNewTab: openInNewTab });
  }

  function resetUI() {
    itemsContainer.innerHTML = '';
  }

  // TODO: replace this with another mechanism (React, Preact, Inferno, Vue...)
  function buildItemElement( item ) {
    let liElement        = document.createElement('li');
    let faviconElement   = document.createElement('img');
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

    liElement.className      = 'item';
    faviconElement.className = 'favicon';
    titleContent.className   = 'title';
    urlContent.className     = 'url';

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

    faviconElement.setAttribute('src', faviconUrl( item.resolved_url ) );

    titleContent.appendChild( faviconElement );
    titleContent.appendChild( document.createTextNode( item.resolved_title ) );

    urlContent.appendChild( document.createTextNode( formatUrl( item.resolved_url ) ) );

    tickElement.appendChild( tickIconFont );
    tickAction.appendChild( tickElement );
    tickAction.appendChild( tickLoadElement );

    trashElement.appendChild( trashIconFont );
    deleteAction.appendChild( trashElement );
    deleteAction.appendChild( trashLoadElement );

    actionContainer.appendChild( tickAction );
    actionContainer.appendChild( deleteAction );

    liElement.appendChild( actionContainer );
    liElement.appendChild( titleContent );
    liElement.appendChild( document.createElement('br') );
    liElement.appendChild( urlContent );

    liElement.dataset.id = item.id;

    let itemClickEventHandler = ( event ) => {
      event.preventDefault();
      const openInNewTab = true;

      switch( event.button ) {
        case MouseButtons.MIDDLE:
          Logger.log('(itemClickEventHandler) Middle-click, force opening in new tab');
          openLink( item.id, openInNewTab );
          break;
        case MouseButtons.LEFT:
          if( event.ctrlKey || event.metaKey ) {
            Logger.log(`(itemClickEventHandler) Left-click + ctrlKey:${ event.ctrlKey } / metaKey:${ event.metaKey }, force opening in new tab`);
            openLink( item.id, openInNewTab );
          } else {
            Logger.log('(itemClickEventHandler) Left-click no modifier key, will open based on openInNewTab setting');
            openLink( item.id );
          }
          break;
      }
    };

    titleContent.addEventListener( 'mouseup', itemClickEventHandler );
    urlContent.addEventListener(   'mouseup',itemClickEventHandler );

    return liElement;
  }

  function buildBatch() {
    Logger.log('(DomBuilder.buildBatch) build a new batch of ' + ITEMS_PER_BATCH + ' items');

    for( let i = 0; i < ITEMS_PER_BATCH; i++ ) {
      // If we've already built all items then get out of this loop
      if( areAllItemsBuilt() == true ) {
        Logger.log('All items are built -> break out of this loop, now!');
        break;
      }

      let itemToCreate = itemsToCreate[ createdItemsCount ];
      itemsContainer.appendChild( buildItemElement( itemToCreate ) );

      createdItemsCount++;
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
      Logger.log('(DomBuilder.buildAll)');

      // Remove previous "requestAnimationFrame" registered in case
      cancelAnimationFrame( buildBatch );

      // Reset list component content
      resetUI();

      // Prepare dom building
      itemsToCreate     = items;
      totalItemsCount   = items.length;
      createdItemsCount = 0;

      // Build the dom
      Logger.log('(DomBuilder.buildAll) Request a 1st animation frame for buildBatch method');
      requestAnimationFrame( buildBatch );
    },

    appendItem: function( itemToAppend ) {
      Logger.log(`(DomBuilder.appendItem) ${ itemToAppend.resolved_title }`);
      itemsContainer.appendChild( buildItemElement( itemToAppend ));
    },

    getVisibleItems: function() {
      const visibleItems = itemsContainer.querySelectorAll('.item:not(.disappearing)');
      const visibleItemsIds = [];

      Logger.log('(DomBuilder.getVisibleItems) ${ visibleItems.length } visible items');

      for( let i = 0; i < visibleItems.length; i++ ) {
        visibleItemsIds.push( visibleItems[ i ].dataset.id );
      }

      return visibleItemsIds;
    }
  };
})();


var UI = ( function() {
  const intervalWithoutOpening = 5*60;
  const defaultDisplaySetting  = { currentPage: 1, query: '' };

  function setSearchFieldValue( query ) {
    Logger.log('(UI.setSearchFieldValue) set search query to ' + query);
    filterItemsInput.value = query || '';

    // Show/Hide the clear search button depending on the restored query value
    if(filterItemsInput.value == '') {
      clearSearchBoxButton.classList.add('hidden');
    } else {
      clearSearchBoxButton.classList.remove('hidden');
    }
  }

  function setZoomLevel() {
    Settings.init().then( function() {
      const zoomLevel = Settings.get( 'zoomLevel' );
      document.documentElement.style.fontSize = zoomLevel;
    });
  }

  function setPaginationVisibility() {
    Settings.init().then( function() {
      const perPage = Settings.get( 'perPage' );
      if( !perPage ) {
        paginationContainer.style.display = 'none';
      }
    });
  }

  function updateCurrentPage( page, perPage, itemsCount ) {
    const pagesCount   = Math.ceil( itemsCount / perPage ) || 1;
    const currentCount = paginationPageSelector.children.length;

    if( currentCount != pagesCount ) {
      buildPageSelector( perPage, itemsCount );
    }

    paginationPageSelector.value = page;
  }

  function disablePaginationButton( element, handler ) {
    element.classList.add( 'disabled' );
    element.removeEventListener( 'click', handler );
  }

  function enablePaginationButton( element, handler ) {
    element.classList.remove( 'disabled' );
    element.addEventListener( 'click', handler );
  }

  function updatePaginationButtonsState( page, perPage, itemsCount ) {
    const pagesCount = Math.ceil( itemsCount / perPage );

    if( pagesCount == 0 || pagesCount == 1 ) {
      Logger.log(`(UI.updatePaginationButtonsState) Only 1 page, disable "next" & "previous" links`);

      disablePaginationButton( paginationPreviousPageButton, previousPageEventListener );
      disablePaginationButton( paginationNextPageButton, nextPageEventListener );
    } else {
      enablePaginationButton( paginationPreviousPageButton, previousPageEventListener );
      enablePaginationButton( paginationNextPageButton, nextPageEventListener );

      if( page == 1 ) {
        // First page
        Logger.log(`(UI.updatePaginationButtonsState) Page 1/${ pagesCount }, disable "previous" link`);
        disablePaginationButton( paginationPreviousPageButton, previousPageEventListener );
      }

      if( page == pagesCount ) {
        // Last page
        Logger.log(`(UI.updatePaginationButtonsState) Page ${ page }/${ pagesCount }, disable "next" link`);
        disablePaginationButton( paginationNextPageButton, nextPageEventListener );
      }
    }
  }

  function buildPageSelector( perPage, itemsCount ) {
    if( !perPage ) {
      return;
    }

    const pagesCount = Math.ceil( itemsCount / perPage ) || 1;

    // Empty the pagination selector
    while( paginationPageSelector.firstChild ) {
      paginationPageSelector.removeChild( paginationPageSelector.firstChild );
    }

    // Recreate all the options
    for ( let i = 0; i < pagesCount; i++ ) {
      let option = document.createElement('option');
      option.setAttribute('value', i + 1 );
      option.innerText = `${ i + 1 } / ${ pagesCount }`;

      paginationPageSelector.appendChild(option);
    }

    // By default, the selector is hidden until it's completely built
    paginationPageSelector.style.display = 'inline-block';
  }

  return {
    focusSearchField: function() {
      setTimeout( function() {
        filterItemsInput.focus();
      }, 200 );
    },

    setup: function() {
      // Set default zoom level based on Settings
      setZoomLevel();

      // Show pagination if setting is enabled
      setPaginationVisibility();

      Authentication.isAuthenticated().then( function( access_token ) {
        document.querySelector( '.authentication' ).classList.add( 'hidden' );
        document.querySelector( '.authenticated'  ).classList.remove( 'hidden' );

        browser.storage.local.get( 'display', function( { display } ) {
          const currentTimestamp = ( Date.now() / 1000 | 0 );
          const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
          const lastDisplay   = parsedDisplay.displayedAt;

          let displayOptions  = Object.assign( {}, parsedDisplay );

          // Reset query and currentPage if more than `intervalWithoutOpening` since last opening
          if( lastDisplay && currentTimestamp - lastDisplay > intervalWithoutOpening ) {
            Logger.log( "(UI.setup) reset page to 1 and filter to ''" );
            Object.assign( displayOptions, defaultDisplaySetting );
          }

          // Set initial filter value in the UI and focus the field
          setSearchFieldValue( displayOptions.query );
          UI.focusSearchField();

          // Updates display.displayedAt and page + query if they have been reset
          Object.assign( displayOptions, { displayedAt: currentTimestamp });
          Logger.log( "(UI.setup) Save display variable to local storage: " + displayOptions );
          browser.storage.local.set( { display: JSON.stringify( displayOptions ) } );
        });

        // Enable the loading animation and update the list of items
        MainLoader.enable();
        chrome.runtime.sendMessage({ action: 'retrieve-items', force: false });
      }, function( error ) {
        let authenticationButton = document.querySelector( '.authentication button' );

        document.querySelector( '.authentication' ).classList.remove( 'hidden' );
        document.querySelector( '.authenticated'  ).classList.add( 'hidden' );

        authenticationButton.addEventListener( 'click', function() {
          chrome.runtime.sendMessage({ action: 'authenticate' });
        });
      });
    },


    // TODO: extract more of the pagination logic from here
    // TODO: add some logging for paging and so forth
    // TODO: almost all logic duplicated with updateList
    drawList: function( opts = {} ) {
      Settings.init().then( function() {
        return Settings.get( 'perPage' );
      }).then( function( perPage ) {
        browser.storage.local.get( [ 'items', 'display' ], function( { items, display } ) {
          const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
          let query           = opts.query || parsedDisplay.query;
          let pageToDisplay   = opts.page  || parsedDisplay.currentPage;

          // Parse and filter the item list
          // let parsedItems   = Utility.parseJson( items ) || [];
          let filteredItems = Items.filter( items, query );
          let itemsToRender = Items.paginate( filteredItems, pageToDisplay, perPage );

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

          // Record currentPage and query, in case they've been "forced" through the opts param
          // `displayedAt` value must remain the same (that's why we assign `parsedDisplay`)
          const actualDisplay  = { currentPage: pageToDisplay, query: query };
          const displayOptions = Object.assign( {}, parsedDisplay, actualDisplay );
          browser.storage.local.set({ display: JSON.stringify( displayOptions ) });

          // Updates the UI: page selector with the current page options
          buildPageSelector( perPage, filteredItems.length );
          updateCurrentPage( pageToDisplay, perPage, filteredItems.length );

          // Disables the navigation buttons if need be
          updatePaginationButtonsState( pageToDisplay, perPage, filteredItems.length );
        });
      });

      return;
    },


    // TODO: almost all logic duplicated with drawList
    updateList: function( opts = {} ) {
      Settings.init().then( function() {
        return Settings.get( 'perPage' );
      }).then( function( perPage ) {
        // If there's no pagination enabled, we don't need to do any of this
        if( !perPage ) {
          Logger.log('(UI.updateList) pagination disabled, no need to run this piece of logic');
          return;
        }

        Logger.log('(UI.updateList) pagination enabled, will update the display');
        browser.storage.local.get( [ 'items', 'display' ], function( { items, display } ) {
          const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
          let query           = opts.query || parsedDisplay.query;
          let pageToDisplay   = opts.page  || parsedDisplay.currentPage;

          // Parse and filter the item list
          // let parsedItems   = Utility.parseJson( items ) || [];
          let filteredItems = Items.filter( items, query );
          let itemsToRender = Items.paginate( filteredItems, pageToDisplay, perPage );

          // If search enabled && no more items to render, display the "no results" message
          if( query && itemsToRender.length == 0 ) {
            listComponent.classList.add( 'hidden' );
            placeholderNoResults.classList.remove( 'hidden' );
          }

          // If there are missing items, they must necessarily be inserted at the end of the list
          // It's the only current scenario for this method
          let currentVisibleItemsIds = DomBuilder.getVisibleItems();

          // If item that should be visible can't be found, we append it at the end of the list
          for( let item of itemsToRender ) {
            if( currentVisibleItemsIds.indexOf( item.id ) < 0 ) {
              Logger.log(`(UI.updateList) missing item ${ item.id } / ${ item.resolved_title }`);
              DomBuilder.appendItem( item );
            }
          }

          // Updates the UI: page selector with the current page options
          buildPageSelector( perPage, filteredItems.length );
          updateCurrentPage( pageToDisplay, perPage, filteredItems.length );

          // Disables the navigation buttons if need be
          updatePaginationButtonsState( pageToDisplay, perPage, filteredItems.length );
        });
      });

      return;
    },

    markAsRead: ( itemId ) => {
      const item = document.querySelector( ".item[data-id='" + itemId + "']");
      item.classList.add('removing');
      item.querySelector('.tick-action .tick'   ).classList.add(    'hidden' );
      item.querySelector('.tick-action .loader' ).classList.remove( 'hidden' );

      chrome.runtime.sendMessage( { action: 'mark-as-read', id: itemId } );
    },

    deleteItem: ( itemId ) => {
      const item = document.querySelector( ".item[data-id='" + itemId + "']");
      item.classList.add('removing');
      item.querySelector('.delete-action .trash'  ).classList.add(   'hidden' );
      item.querySelector('.delete-action .loader' ).classList.remove( 'hidden' );

      chrome.runtime.sendMessage( { action: 'delete-item', id: itemId } );
    },

    fadeOutItem: ( itemId ) => {
      document.querySelector( ".item[data-id='" + itemId + "']" ).classList.add( 'disappearing' );
    },

    // TODO: lots of duplication here. I need to extract all this items logic into
    //       a dedicated module to avoid repeating the filtering code etc..
    updatePaginationElements: () => {
      Settings.init().then( function() {
        return Settings.get( 'perPage' );
      }).then( function( perPage ) {
        browser.storage.local.get( [ 'items', 'display' ], function( { items, display } ) {
          const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
          let query           = parsedDisplay.query;
          let pageToDisplay   = parsedDisplay.currentPage;

          // Parse and filter the item list
          // let parsedItems   = Utility.parseJson( items ) || [];
          let filteredItems = Items.filter( items, query );

          updatePaginationButtonsState( pageToDisplay, perPage, filteredItems.length );
          buildPageSelector( perPage, filteredItems.length );
          updateCurrentPage( pageToDisplay, perPage, filteredItems.length );
        });
      });
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
      Logger.warn('(popup onMessage) : ' + eventData);

      let flashContainer = document.querySelector( '.flash-overlay' );
      let flashMessage   = '';
      let errorClass     = 'error';
      let noticeClass    = 'notice';

      flashContainer.classList.remove( errorClass  );
      flashContainer.classList.remove( noticeClass );

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
            flashMessage += 'max requests reached for this hour';
            flashMessage += ' (reset in ' + eventData.resetDelay + ')';
            break;
        }

        // Flash the badge if an error occured
        chrome.runtime.sendMessage({ action: 'flash-error' });

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
      setTimeout( () => {
        flashContainer.classList.add( 'hidden' );
      }, 5000 );

    } else {
      Logger.log('(popup onMessage) : ' + eventData.action);

      switch( eventData.action ) {
        case 'authenticated':
          window.close();
          chrome.runtime.sendMessage({ action: 'update-badge-count' });
          break;

        case 'marked-as-read':
        case 'deleted':
          UI.fadeOutItem( eventData.id );
          UI.updateList();
          break;

        case 'added-item':
          UI.drawList();
          UI.updatePaginationElements();
          break;

        case 'retrieved-items':
          UI.drawList();
          Badge.updateCount();
          break;
      }
    }
  });
});
