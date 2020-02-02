"use strict";

import Logger          from './logger.js';
import PopupUI         from './popup_ui.js';
import PopupMainLoader from './popup_main_loader.js';
import Utility         from './utility.js';
import { FavoriteFilterState } from './constants.js';

// ----------------

const PopupTopFilter = ( function() {
  const filterItemsInput     = document.querySelector('.filter-items');
  const clearSearchBoxButton = document.querySelector('.clear-search-box');

  function onFilterChanged() {
    const query = filterItemsInput.value.toLowerCase();
    if(query !== '') {
      PopupMainLoader.enable();
      clearSearchBoxButton.classList.remove('hidden');
    } else {
      clearSearchBoxButton.classList.add('hidden');
    }

    // Save query to localStorage 'display' variable
    browser.storage.local.get('display').then( ({ display }) => {
      const parsedDisplay  = Utility.parseJson(display) || {};
      const displayOptions = Object.assign({}, parsedDisplay, { query: query });
      browser.storage.local.set({ display: JSON.stringify(displayOptions) });
    });

    // Draw the items lists
    Logger.log(`(onFilterChanged) will draw list with query=${query}`);
    PopupUI.drawList({ page: 1, query: query });
    PopupMainLoader.disable(true);
  }

  return {
    getFavoriteFilterState: function() {
      const currentFilter = filterItemsInput.value;
      if(currentFilter.includes('is:faved')) return FavoriteFilterState.ON;
      if(currentFilter.includes('is:unfaved')) return FavoriteFilterState.OFF;
      return FavoriteFilterState.UNSET;
    },

    setValue: function(query) {
      Logger.log(`(PopupTopFilter.setValue) set search query to ${query}`);
      filterItemsInput.value = query || '';

      // Show/Hide the clear search button depending on the restored query value
      if(filterItemsInput.value === '') {
        clearSearchBoxButton.classList.add('hidden');
      } else {
        clearSearchBoxButton.classList.remove('hidden');
      }
    },

    focusSearchField: function() {
      setTimeout( function() {
        filterItemsInput.focus();
      }, 200);
    },

    setupEventListeners: function() {
      clearSearchBoxButton.addEventListener('click', () => {
        filterItemsInput.value = '';
        debouncedFilterEventHandler.apply(filterItemsInput);
        PopupTopFilter.focusSearchField();
      });

      const debouncedFilterEventHandler = Utility.debounce(onFilterChanged, 200);
      filterItemsInput.addEventListener('input', debouncedFilterEventHandler);
    }
  };
})();

export default PopupTopFilter;
