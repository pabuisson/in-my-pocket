"use strict";

import Settings from './settings.js';


// -------------------------------------


var Badge = ( function() {
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
          chrome.browserAction.setBadgeBackgroundColor({ color: '#444' });

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
    }
  }
})();


export default Badge
