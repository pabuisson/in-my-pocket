"use strict";

import Settings from './settings.js';


// -------------------------------------


var Badge = ( function() {
  let defaultBackgroundColor = '#444';
  let successBackgroundColor = '#50bcb6';

  function itemsNumbers( items ) {
    if( items && Object.keys( items ).length > 0 ) {
      return Object.keys( items ).length;
    } else {
      return '';
    }
  }

  return {
    hide: function() {
      chrome.browserAction.setBadgeText({ text: '' });
    },

    updateCount: function( items ) {
      Settings.init().then( function() {
        let showBadge = Settings.get( 'showBadge' );
        if( showBadge === true ) {
          chrome.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });

          if( items ) {
            let itemsCount = itemsNumbers( items );
            chrome.browserAction.setBadgeText({ text: itemsCount.toString() });
          } else {
            browser.storage.local.get( 'items', function( { items } ) {
                let itemsCollection = items ? JSON.parse( items ) : [];
              let itemsCount = itemsNumbers( itemsCollection );
              chrome.browserAction.setBadgeText({ text: itemsCount.toString() });
            });
          }
        } else {
          // If showBadge != true, we hide the count badge
          Badge.hide();
        }
      });
    },

    flashSuccess: function() {
      browser.storage.local.get( 'items', ({ items }) => {
        let parsedItems = JSON.parse( items );

        browser.browserAction.setBadgeText({ text: '✓' });
        browser.browserAction.setBadgeBackgroundColor({ color: successBackgroundColor });

        setTimeout( function() {
          // Reset the color to default
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });
          // Update the badge if needed
          Badge.updateCount( parsedItems );
        }, 2500);
      });
    }
  }
})();


export default Badge
