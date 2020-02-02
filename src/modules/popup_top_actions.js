"use strict";

import PopupMainLoader from './popup_main_loader.js';
import PopupTopFilter from './popup_top_filter';
import PopupUI from './popup_ui';
import Utility from './utility';
import { FavoriteFilterState } from './constants';

// ----------------

const PopupTopActions = ( function() {
  const addCurrentPageButton = document.querySelector('.add-current');
  const filterItemsInput     = document.querySelector('.filter-items');
  const openSettingsButton   = document.querySelector('.open-settings');
  const readRandomItemButton = document.querySelector('.random-item');
  const retrieveItemsButton  = document.querySelector('.retrieve-items');
  const filterFavoriteIcon   = document.querySelector('.filter-faved');
  const filterFavoriteIconOn = document.querySelector('.filter-faved-on');
  const filterFavoriteIconOff = document.querySelector('.filter-faved-off');

  return {
    setupEventListeners: function() {
      retrieveItemsButton.addEventListener('click', function() {
        PopupMainLoader.enable();
        browser.runtime.sendMessage({ action: 'retrieve-items', force: true });
      });

      filterFavoriteIcon.addEventListener('click', function() {
        const previousQuery = filterItemsInput.value;
        let newQuery = '';
        const currentFilterState = PopupTopFilter.getFavoriteFilterState();

        if(currentFilterState == FavoriteFilterState.ON) {
          newQuery = previousQuery.replace('is:faved', 'is:unfaved').trim();
          filterFavoriteIcon.style.color = '#d70022';
        } else if(currentFilterState == FavoriteFilterState.OFF) {
          newQuery = previousQuery.replace('is:unfaved', '').trim();
          filterFavoriteIcon.style.color = 'grey';
        } else if(currentFilterState == FavoriteFilterState.UNSET) {
          newQuery = `${previousQuery} is:faved`;
          filterFavoriteIcon.style.color = '#12bc00';
        }

        // Set the new search query in the UI
        PopupTopFilter.setValue(newQuery);

        // Save query to localStorage 'display' variable
        browser.storage.local.get('display').then( ({ display }) => {
          const parsedDisplay  = Utility.parseJson(display) || {};
          const displayOptions = Object.assign({}, parsedDisplay, { query: newQuery });
          browser.storage.local.set({ display: JSON.stringify(displayOptions) });
        });

        PopupUI.drawList();
      });

      addCurrentPageButton.addEventListener('click', function() {
        PopupMainLoader.enable();
        browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
          const currentUrl   = currentTab.url;
          const currentTitle = currentTab.title;
          const addItemOptions = { action: 'add-item', url: currentUrl, title: currentTitle, tabId: currentTab.id };
          browser.runtime.sendMessage(addItemOptions);
        });
      });

      readRandomItemButton.addEventListener('click', () => {
        browser.runtime.sendMessage({
          action: 'random-item',
          query: filterItemsInput.value
        });
      });

      openSettingsButton.addEventListener('click', () => {
        // Close the popup in a setTimeout, otherwise the "openOptionsPage" part
        // has no valid "context" to be executed (and closing the popup in the promise
        // feels a lot slower)
        setTimeout( window.close, 100 );
        browser.runtime.openOptionsPage();
      });
    }
  };
})();

export default PopupTopActions;
