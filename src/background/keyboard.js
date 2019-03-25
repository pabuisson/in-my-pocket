"use strict";

import Items      from '../modules/items.js';
import Keyboard   from '../modules/keyboard.js';
import Settings   from '../modules/settings.js';
import { KeyboardShortcuts } from '../modules/constants.js';


// ---------------


// browser.commands.update available for FF 60+ only
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands/update
if(browser.commands.update) {
  Settings.init().then( function() {
    const settings = Settings.get();

    Keyboard.registerShortcut(KeyboardShortcuts.toggle,    settings.keyboardToggle);
    Keyboard.registerShortcut(KeyboardShortcuts.openPopup, settings.keyboardOpenPopup);
    Keyboard.registerShortcut(KeyboardShortcuts.openFirstItem,  settings.keyboardOpenFirstItem);
    Keyboard.registerShortcut(KeyboardShortcuts.openRandomItem, settings.keyboardOpenRandomItem);
  });
}


browser.commands.onCommand.addListener( (command) => {
  if( command === KeyboardShortcuts.toggle ) {
    browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
      //
      // PageAction.toggle(currentTab);
      //

      // FIXME: duplication with PageACtion.toggle())
      browser.storage.local.get('items').then( ({ items }) => {
        const matchingItem = Items.find( items, { url: currentTab.url });

        if( matchingItem ) {
          Items.markAsRead( matchingItem.id );
        } else {
          const addItemOptions = { closeTabId: currentTab.id };
          Items.addItem( currentTab.url, currentTab.title, addItemOptions );
        }
      });
    });
  }
});
