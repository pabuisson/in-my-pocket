"use strict";

import Items from './modules/items.js';


// ---------------


browser.commands.onCommand.addListener( (command) => {
  if( command === "toggle-page-status" ) {
    browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
      const currentUrl   = currentTab.url;
      const currentTitle = currentTab.title;

      browser.storage.local.get( 'items', ({ items }) => {
        const matchingItem = Items.find( items, { url: currentUrl });

        if( matchingItem ) {
          Items.markAsRead( matchingItem.id );
        } else {
          const addItemOptions = { closeTabId: currentTab.id };
          Items.addItem( currentUrl, currentTitle, addItemOptions );
        }
      });
    });
  }
});

