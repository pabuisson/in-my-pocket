"use strict";

import Logger from '../modules/logger.js';
import Settings from '../modules/settings.js';
import Badge from '../modules/badge.js';
import Authentication from '../modules/authentication.js';

// -------------

let displayBadgeCountCheckbox = document.querySelector( '.display-badge-count' );
let disconnectAccountAction   = document.querySelector( '.disconnect-account' );
let disconnectAccountRow      = document.querySelector( '.disconnect-account-row' );



var UI = ( function() {
  return {
    setup: function() {
      // If user is not connected, we hide the "disconnect" link
      Authentication.isAuthenticated().catch( function() {
        disconnectAccountRow.style.display = 'none';
      });

      // Load the other settings values
      Settings.init().then( function() {
        let settings = Settings.get();
        displayBadgeCountCheckbox.checked = settings[ 'showBadge' ];
      });

      // Event : "Display count badge" checkbox
      displayBadgeCountCheckbox.addEventListener( 'change', function() {
        Settings.set( 'showBadge', this.checked );
        Settings.save();
        Badge.updateCount();
      });


      // Event : "Disconnect" from the Pocket account click
      disconnectAccountAction.addEventListener( 'click', function() {
        // TODO Use a better UI for confirmation (maybe inline button that appear
        //      and update the UI once disconnected)
        let mustDisconnect = confirm("You're about to disconnect from your pocket account. Are you sure ?");
        if( mustDisconnect ) {
          browser.storage.local.get().then( function( data ) {
            let keysToPersist = [ 'settings' ];
            let keysToRemove = Object.keys( data ).filter( function( key ) {
              // Filter out the keys that are listed in keysToPersist, and keeps
              // all the other storage keys -> those will be removed
              return keysToPersist.indexOf( key ) < 0;
            });

            browser.storage.local.remove( keysToRemove );

            Badge.hide();
            disconnectAccountRow.style.display = 'none';
          });
        }
      });
    }
  };
})();


// ---------------------------------------


document.addEventListener('DOMContentLoaded', function() {
  UI.setup();
});
