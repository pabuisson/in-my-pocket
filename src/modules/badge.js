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
      browser.browserAction.setBadgeText({ text: '' });
    },

    updateCount: function( items ) {
      Settings.init().then( function() {
        let showBadge = Settings.get( 'showBadge' );
        if( showBadge === true ) {
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });

          if( items ) {
            let itemsCount = itemsNumbers( items );
            browser.browserAction.setBadgeText({ text: itemsCount.toString() });
          } else {
            browser.storage.local.get('items').then( ({ items }) => {
              let itemsCollection = Utility.parseJson( items ) || [];
              let itemsCount = itemsNumbers( itemsCollection );
              browser.browserAction.setBadgeText({ text: itemsCount.toString() });
            });
          }
        } else {
          // If showBadge != true, we hide the count badge
          Badge.hide();
        }
      });
    },

    flashSuccess: function() {
      browser.storage.local.get('items').then( ({ items }) => {
        let parsedItems = Utility.parseJson( items ) || [];

        browser.browserAction.setBadgeText({ text: '✓' });
        browser.browserAction.setBadgeBackgroundColor({ color: successBackgroundColor });

        setTimeout( function() {
          // Reset the color to default
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });
          // Update the badge if needed
          Badge.updateCount( parsedItems );
        }, 2000);
      });
    },

    flashError: function() {
      browser.storage.local.get('items').then( ({ items }) => {
        let parsedItems = Utility.parseJson( items ) || [];

        browser.browserAction.setBadgeText({ text: '!' });
        browser.browserAction.setBadgeBackgroundColor({ color: errorBackgroundColor });

        setTimeout( function() {
          // Reset the color to default
          browser.browserAction.setBadgeBackgroundColor({ color: defaultBackgroundColor });
          // Update the badge if needed
          Badge.updateCount( parsedItems );
        }, 2000);
      });
    }
  };
})();


export default Badge;
