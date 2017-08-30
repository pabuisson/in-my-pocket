"use strict";

require( "file-loader?name=[path][name].[ext]!./options.html" );
import './options.scss';

import Logger from '../modules/logger.js';
import Settings from '../modules/settings.js';
import Badge from '../modules/badge.js';
import ContextMenu from '../modules/context_menu.js';
import Authentication from '../modules/authentication.js';

// -------------

let displayBadgeCountCheckbox = document.querySelector( '.display-badge-count' );
let openInNewTabCheckbox      = document.querySelector( '.open-in-new-tab' );
let disconnectAccountAction   = document.querySelector( '.disconnect-account' );
let disconnectAccountRow      = document.querySelector( '.disconnect-account-row' );
let zoomLevelSelector         = document.querySelector( '.zoom-level' );



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
        openInNewTabCheckbox.checked      = settings[ 'openInNewTab' ];
        zoomLevelSelector.value           = settings[ 'zoomLevel' ];
      });

      // Event: "Display count badge" checkbox
      displayBadgeCountCheckbox.addEventListener( 'change', function() {
        Settings.set( 'showBadge', this.checked );
        Settings.save();
        Badge.updateCount();
      });

      // Event: "Open in new tab" checkbox
      openInNewTabCheckbox.addEventListener( 'change', function() {
        Settings.set( 'openInNewTab', this.checked );
        Settings.save();
      });

      // Event: "Zoom level" selector
      zoomLevelSelector.addEventListener( 'change', function() {
        Settings.set( 'zoomLevel', this.value );
        Settings.save();
      });

      // Event : "Disconnect" from the Pocket account click
      disconnectAccountAction.addEventListener( 'click', function() {
        // TODO Enhance UI for confirmation (maybe inline button that appear and update the UI
        //      once disconnected)
        let mustDisconnect = confirm("You're about to disconnect from your pocket account. Go on?");
        if( mustDisconnect ) {
          browser.storage.local.get().then( function( data ) {
            let keysToPersist = [ 'settings' ];
            let keysToRemove = Object.keys( data ).filter( function( key ) {
              // Filter out keys listed in keysToPersist, and keeps
              // all the other storage keys -> those will be removed
              return keysToPersist.indexOf( key ) < 0;
            });

            browser.storage.local.remove( keysToRemove );

            // Remove the badge and destroy all right-click entries
            Badge.hide();
            ContextMenu.destroyEntries();

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
