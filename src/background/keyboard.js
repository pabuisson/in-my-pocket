"use strict";

import Items      from '../modules/items.js';
import Keyboard   from '../modules/keyboard.js';
import Logger     from '../modules/logger.js';
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

browser.commands.onCommand.addListener( command => {
  switch(command) {
    case KeyboardShortcuts.toggle:
      Logger.log('(keyboard) KeyboardShortcuts.toggle');
      browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
        // FIXME: duplication with PageAction.toggle())
        browser.storage.local.get('items').then( ({ items }) => {
          const matchingItem = Items.find( items, { url: currentTab.url });

          if(matchingItem) {
            browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
              Items.markAsRead(matchingItem.id, currentTab.id);
            });
          } else {
            Items.addItem([{ url: currentTab.url, title: currentTab.title, tabId: currentTab.id }]);
          }
        });
      });
      break;
    case KeyboardShortcuts.openFirstItem:
      Logger.log('(keyboard) KeyboardShortcuts.openFirstItem');
      Items.openFirst();
      break;
    case KeyboardShortcuts.openRandomItem:
      Logger.log('(keyboard) KeyboardShortcuts.openRandomItem');
      Items.openRandom();
      break;
  }
});
