"use strict";

import Logger from '../modules/logger.js';
import Settings from '../modules/settings.js';
import Badge from '../modules/badge.js';

// -------------

let displayBadgeCountCheckbox = document.querySelector( '.display-badge-count' );
// let disconnectPocketAccount   = document.querySelector( '.disconnect-account' );



var UI = ( function() {
  return {
    showBadge: function() {
      // TODO
    },

    hideBadge: function() {
      chrome.browserAction.setBadgeText({ text: '' });
    },

    setup: function() {
      Settings.init().then( function() {
        let settings = Settings.get();

        // Load initial value for the UI
        displayBadgeCountCheckbox.checked = settings[ 'showBadge' ];
      });

      // Setup events handler
      displayBadgeCountCheckbox.addEventListener( 'change', function() {
        Settings.set( 'showBadge', this.checked );
        Settings.save();
        Badge.updateCount();
      });
    }
  };
})();


// ---------------------------------------


document.addEventListener('DOMContentLoaded', function() {
  UI.setup();
});
