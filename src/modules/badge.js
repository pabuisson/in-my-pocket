"use strict";

import Settings from './settings.js';
import Utility from './utility.js';


// -------------------------------------


var Badge = ( function() {
  let defaultBackgroundColor = '#333';
  let successBackgroundColor = '#12bc00'; // ff-green-60
  let errorBackgroundColor   = '#ff0039'; // ff-red-50

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
              let itemsCollection = Utility.parseJson( items ) || [];
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

    // TODO: code duplication with flashError
    flashSuccess: function() {
      browser.storage.local.get( 'items', ({ items }) => {
        let parsedItems = Utility.parseJson( items ) || [];

        browser.browserAction.setBadgeText({ text: '✓' });
        browser.browserAction.setBadgeBackgroundColor({ color: successBackgroundColor });

        setTimeout( function() {
          // Reset the color to default
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });
          // Update the badge if needed
          // TODO: pass the items count instead of the collection
          Badge.updateCount( parsedItems );
        }, 2000);
      });
    },

    // TODO: code duplication with flashSuccess
    // TODO: in case of an error, I could just get the badge number, display the
    //       error notification and redisplay the previous value afterwards
    flashError: function() {
      browser.storage.local.get( 'items', ({ items }) => {
        let parsedItems = Utility.parseJson( items ) || [];

        browser.browserAction.setBadgeText({ text: '!' });
        browser.browserAction.setBadgeBackgroundColor({ color: errorBackgroundColor });

        setTimeout( function() {
          // Reset the color to default
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });
          // Update the badge if needed
          // TODO: pass the items count instead of the collection
          Badge.updateCount( parsedItems );
        }, 2000);
      });
    }
  };
})();


export default Badge;
