"use strict";

import Authentication  from '../modules/authentication.js';
import Items           from '../modules/items.js';
import Logger          from '../modules/logger.js';
import PopupItemList   from '../modules/popup_item_list.js';
import PopupPagination from '../modules/popup_pagination.js';
import PopupTopActions from '../modules/popup_top_actions.js';
import PopupTopFilter  from '../modules/popup_top_filter.js';
import Settings        from '../modules/settings.js';
import Utility         from '../modules/utility.js';

// ----------------

var PopupUI = ( function() {
  const intervalWithoutOpening = 5*60;
  const defaultDisplaySetting  = { currentPage: 1, query: '' };

  const listComponent        = document.querySelector('.list-component');
  const placeholderNoResults = document.querySelector('.search-no-results');

  function setupEventListeners() {
    PopupPagination.setupEventListeners();
    PopupTopActions.setupEventListeners();
    PopupTopFilter.setupEventListeners();
  }

  function setZoomLevel() {
    Settings.init().then( function() {
      const zoomLevel = Settings.get( 'zoomLevel' );
      document.documentElement.style.fontSize = zoomLevel;
    });
  }

  function setupAuthenticatedUI() {
    // User is authenticated
    document.querySelector('.authentication').classList.add('hidden');
    document.querySelector('.authenticated').classList.remove('hidden');

    // Show pagination if setting is enabled
    PopupPagination.setPaginationVisibility();

    // Set up the event listeners on the UI
    setupEventListeners();

    browser.storage.local.get('display').then(({ display }) => {
      const currentTimestamp = ( Date.now() / 1000 | 0 );
      const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
      const lastDisplay   = parsedDisplay.displayedAt;

      let displayOptions  = Object.assign({}, parsedDisplay);

      // Reset query and currentPage if more than `intervalWithoutOpening` since last opening
      if(lastDisplay && currentTimestamp - lastDisplay > intervalWithoutOpening) {
        Logger.log( "(PopupUI.setupAuthenticatedUI) reset page to 1 and filter to ''" );
        Object.assign(displayOptions, defaultDisplaySetting);
      }

      // Set initial filter value in the PopupUI and focus the field
      PopupTopFilter.setValue(displayOptions.query);
      PopupTopFilter.focusSearchField();

      // Updates display.displayedAt and page + query if they have been reset
      Object.assign(displayOptions, { displayedAt: currentTimestamp });
      Logger.log("(PopupUI.setupAuthenticatedUI) Save display variable to local storage: " + displayOptions);
      browser.storage.local.set({ display: JSON.stringify( displayOptions ) });
    });
  }

  function setupUnauthenticatedUI() {
    Logger.log('(PopupUI.setupUnauthenticatedUI)');

    // User is not authenticated yet
    let authenticationButton = document.querySelector('.authentication button');
    let pocketSignupLink     = document.querySelector('.authentication .signup');

    document.querySelector('.authentication').classList.remove('hidden');
    document.querySelector('.authenticated').classList.add('hidden');

    authenticationButton.addEventListener( 'click', () => {
      browser.runtime.sendMessage({ action: 'authenticate' });
    });

    pocketSignupLink.addEventListener('click', () => {
      setTimeout( () => {
        window.close();
      }, 200);
    });
  }

  function togglePlaceholderVisibility(itemsCount) {
    if(itemsCount > 0) {
      listComponent.classList.remove('hidden');
      placeholderNoResults.classList.add('hidden');
    } else {
      listComponent.classList.add('hidden');
      placeholderNoResults.classList.remove('hidden');
    }
  }

  return {
    setup: function() {
      // Set default zoom level based on Settings
      setZoomLevel();

      Authentication.isAuthenticated().then( () => {
        setupAuthenticatedUI();
      }, () => {
        setupUnauthenticatedUI();
      });
    },

    // TODO: extract more of the pagination logic from here
    // TODO: add some logging for paging and so forth
    // TODO: reduce duplication with drawList !?
    drawList: function(opts = {}) {
      Settings.init().then( function() {
        return Settings.get('perPage');
      }).then( function(perPage) {
        browser.storage.local.get([ 'items', 'display' ]).then( ({ items, display }) => {
          const parsedDisplay = Utility.parseJson(display) || defaultDisplaySetting;
          let query           = opts.query || parsedDisplay.query;
          let pageToDisplay   = opts.page  || parsedDisplay.currentPage;

          // Parse and filter the item list
          let filteredItems = Items.filter(items, query);
          let itemsToRender = Items.paginate(filteredItems, pageToDisplay, perPage);

          // Display the "no results" message or hide it
          togglePlaceholderVisibility(itemsToRender.length);

          // Rebuild all items
          PopupItemList.buildAll(itemsToRender);

          // Record currentPage and query, in case they've been "forced" through the opts param
          // `displayedAt` value must remain the same (that's why we assign `parsedDisplay`)
          const actualDisplay  = { currentPage: pageToDisplay, query: query };
          const displayOptions = Object.assign({}, parsedDisplay, actualDisplay);
          browser.storage.local.set({ display: JSON.stringify( displayOptions ) });

          // Updates the PopupUI: page selector with the current page options
          PopupPagination.updatePaginationUI(pageToDisplay, perPage, filteredItems.length);
        });
      });

      return;
    },

    // TODO: extract more of the pagination logic from here
    // TODO: add some logging for paging and so forth
    // TODO: reduce duplication with drawList !?
    updateList: function( opts = {} ) {
      Settings.init().then( function() {
        return Settings.get( 'perPage' );
      }).then( function( perPage ) {
        browser.storage.local.get([ 'items', 'display' ]).then( ({ items, display }) => {
          const parsedDisplay = Utility.parseJson( display ) || defaultDisplaySetting;
          let query           = opts.query || parsedDisplay.query;
          let pageToDisplay   = opts.page  || parsedDisplay.currentPage;

          // Parse and filter the item list
          let filteredItems    = Items.filter( items, query );
          let itemsToRender    = Items.paginate( filteredItems, pageToDisplay, perPage );
          let itemsToRenderIds = itemsToRender.map( item => item.id );

          // Display the "no results" message or hide it
          togglePlaceholderVisibility(itemsToRender.length);

          // Rebuild all items
          const visibleItemsIds = PopupItemList.getVisibleItemsIds();
          let itemIdsToKeep     = visibleItemsIds.filter( id => itemsToRenderIds.includes(id) );
          let itemIdsToDelete   = visibleItemsIds.filter( id => !itemsToRenderIds.includes(id) );

          // First step: all removed items still visible must disappear
          PopupUI.fadeOutItem(itemIdsToDelete);

          // Second step: prepare the insertion of all missing items
          // Generate a table of all predecessors, to use insertBefore and appendChild to build the DOM
          let predecessorTable = {};
          let nextVisibleItemId = itemIdsToKeep.shift();

          for(let itemToRender of itemsToRender) {
            if(itemToRender.id != nextVisibleItemId) {
              if(predecessorTable[nextVisibleItemId])
                predecessorTable[nextVisibleItemId].push(itemToRender);
              else
                predecessorTable[nextVisibleItemId] = [ itemToRender ];
            } else {
              nextVisibleItemId = itemIdsToKeep.shift() || 'last';
            }
          }

          // Use the predecessor table to inject the new items at the proper place in the list
          for(let key in predecessorTable) {
            const itemsToInject = predecessorTable[key];
            if(key != 'last') {
              // When key is an ID, we insert before the node having this ID
              PopupItemList.insertItems(itemsToInject, key);
            } else {
              // When key is 'last', we append the dom at the end of the list
              PopupItemList.appendItems(itemsToInject);
            }
          }

          // Record currentPage and query, in case they've been "forced" through the opts param
          // `displayedAt` value must remain the same (that's why we assign `parsedDisplay`)
          const actualDisplay  = { currentPage: pageToDisplay, query: query };
          const displayOptions = Object.assign( {}, parsedDisplay, actualDisplay );
          browser.storage.local.set({ display: JSON.stringify( displayOptions ) });

          // Updates the PopupUI: page selector with the current page options
          PopupPagination.updatePaginationUI(pageToDisplay, perPage, filteredItems.length);
        });
      });

      return;
    },

    markAsRead: ( itemId ) => {
      const item = document.querySelector( ".item[data-id='" + itemId + "']");
      item.classList.add('removing');
      item.querySelector('.tick-action .tick'   ).classList.add(    'hidden' );
      item.querySelector('.tick-action .loader' ).classList.remove( 'hidden' );

      browser.runtime.sendMessage( { action: 'mark-as-read', id: itemId } );
    },

    deleteItem: ( itemId ) => {
      const item = document.querySelector( ".item[data-id='" + itemId + "']");
      item.classList.add('removing');
      item.querySelector('.delete-action .trash'  ).classList.add(   'hidden' );
      item.querySelector('.delete-action .loader' ).classList.remove( 'hidden' );

      browser.runtime.sendMessage( { action: 'delete-item', id: itemId } );
    },

    fadeOutItem: (...itemIds) => {
      itemIds.forEach(itemId => {
        document.querySelector(`.item[data-id='${itemId}']`).classList.add('disappearing');
      });
    }
  };
})();

export default PopupUI;
