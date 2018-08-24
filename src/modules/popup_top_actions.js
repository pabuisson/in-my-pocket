"use strict";

import PopupMainLoader from './popup_main_loader.js';

// ----------------

var PopupTopActions = ( function() {
  const addCurrentPageButton = document.querySelector('.add-current');
  const filterItemsInput     = document.querySelector('.filter-items');
  const openSettingsButton   = document.querySelector('.open-settings');
  const readRandomItemButton = document.querySelector('.random-item');
  const retrieveItemsButton  = document.querySelector('.retrieve-items');

  return {
    setupEventListeners: function() {
      retrieveItemsButton.addEventListener( 'click', function() {
        PopupMainLoader.enable();
        browser.runtime.sendMessage({ action: 'retrieve-items', force: true });
      });

      addCurrentPageButton.addEventListener( 'click', function() {
        PopupMainLoader.enable();
        browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
          let currentUrl   = currentTab.url;
          let currentTitle = currentTab.title;
          const addItemOptions = { action: 'add-item', url: currentUrl, title: currentTitle, closeTabId: currentTab.id };
          browser.runtime.sendMessage(addItemOptions);
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
    }
  };
})();

export default PopupTopActions;
