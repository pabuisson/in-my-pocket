"use strict";

import KeyStringifier from './key_stringifier.js';
import KeyIdentifier  from './key_identifier.js';
import Logger         from './logger.js';


// ---------------


const Keyboard = ( function() {
  function isValidKey(ev) {
    const keyCode = ev.which || ev.keyCode || 0;
    const isValidLetter = KeyIdentifier.isLetter(keyCode);
    const isValidDigit = KeyIdentifier.isDigit(keyCode);
    const isValidFkey = KeyIdentifier.isFKey(keyCode);

    return isValidLetter || isValidDigit || isValidFkey;
  }

  return {
    registerShortcut: function(command, shortcut) {
      Logger.log(`Registering shortcut ${shortcut} for command ${command}`);
      browser.commands.update({
        name: command,
        shortcut: shortcut
      });
    },

    // Transform a keyboard event into a shortcut-compliant and readable string
    stringifyCombination: function(ev) {
      const combination = [];

      // Base modifiers
      if(ev.altKey)  { combination.push("Alt"); }
      if(ev.ctrlKey) { combination.push(KeyStringifier.stringifyCtrlKey(ev)); }

      // Optional modifier
      if(ev.shiftKey) { combination.push("Shift"); }

      // Main key
      const mainKey = KeyStringifier.stringifyKey(ev);
      combination.push(mainKey);

      return combination.join('+');
    },

    // NOTE: technically, Firefox accepts 2-modifiers keyboard shortcuts, but not for every version
    //       we won't be supporting this kind of shortcuts for the moment (Ctrl-Alt-A for instance)
    isValidCombination: function(ev) {
      const hasOnlyOneBaseModifier = [ev.altKey, ev.ctrlKey].filter(i=>i).length == 1;
      const isValidMainKey = isValidKey(ev);
      return hasOnlyOneBaseModifier && isValidMainKey;
    }
  };
})();

export default Keyboard;
