"use strict";

import PageAction from '../modules/page_action.js';
import Keyboard   from '../modules/keyboard.js';
import Settings   from '../modules/settings.js';
import { KeyboardShortcuts } from '../modules/constants.js';


// ---------------


// browser.commands.update available for FF 60+ only
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands/update
if(browser.commands.update) {
  Settings.init().then( function() {
    let settings = Settings.get();

    Keyboard.registerShortcut(KeyboardShortcuts.toggle,    settings.keyboardToggle);
    Keyboard.registerShortcut(KeyboardShortcuts.openPopup, settings.keyboardOpenPopup);
  });
}


browser.commands.onCommand.addListener( (command) => {
  if( command === KeyboardShortcuts.toggle ) {
    browser.tabs.query({ active: true, currentWindow: true }).then( ([currentTab]) => {
      PageAction.toggle(currentTab);
    });
  }
});
