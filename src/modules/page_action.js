"use strict";

import Logger from './logger.js';
import Settings from './settings.js';
import Items from './items.js';
import Utility from "./utility";


// -------------------------------------


const PageAction = ( function() {
  function mustDisplayPageAction() {
    const promise = new Promise( ( resolve, reject ) => {
      Settings.init().then( () => {
        Logger.log('must display page action ? ' + Settings.get('showPageAction'));
        if( Settings.get( 'showPageAction' ) ) {
          resolve();
        } else {
          reject();
        }
      });
    });

    return promise;
  }


  return {
    redraw: function( tabId, url ) {
      mustDisplayPageAction().then( () => {
        browser.storage.local.get('items').then( ({ items }) => {
          // const parsedItems  = Utility.parseJson( items ) || [];
          const containsItem = Items.contains( items, { url: url });

          if( containsItem ) {
            PageAction.drawEnabled( tabId );
          } else {
            PageAction.drawDisabled( tabId );
          }

          PageAction.show(tabId);
        });
      });
    },

    redrawAllTabs: function() {
      mustDisplayPageAction().then( () => {
        browser.tabs.query( {} ).then( function( tabs ) {
          for( const tab of tabs ) {
            if( tab.url ) {
              PageAction.redraw( tab.id, tab.url );
            }
          }
        });
      });
    },

    drawEnabled: function( tabId ) {
      mustDisplayPageAction().then( () => {
        // NOTE: using path: "/path/to/svg" does not work properly for FF56 and older
        browser.pageAction.setIcon( { tabId: tabId, path: {
          19: "assets/icons/inmypocket-flat-red.svg",
          38: "assets/icons/inmypocket-flat-red.svg"
        }});
        browser.pageAction.setTitle({ tabId: tabId, title: "Mark as read" });
      });
    },

    drawDisabled: function( tabId ) {
      mustDisplayPageAction().then( () => {
        // NOTE: using path: "/path/to/svg" does not work properly for FF56 and older
        browser.pageAction.setIcon({ tabId: tabId, path: {
          19: "assets/icons/inmypocket-flat-grey-dark.svg",
          38: "assets/icons/inmypocket-flat-grey-dark.svg"
        }});
        browser.pageAction.setTitle({ tabId: tabId, title: "Add to pocket" });
      });
    },

    // TODO: Can't I just add this in my public draw methods? so that it wouldn't be necessary
    //       to manually call this each time I draw some page actions
    show: function( tabId ) {
      mustDisplayPageAction().then( () => {
        browser.pageAction.show( tabId );
      });
    },

    hideAllTabs: function() {
      browser.tabs.query( {} ).then( ( tabs ) => {
        for( const tab of tabs ) {
          browser.pageAction.hide( tab.id );
        }
      });
    },

    // FIXME: this violates SRP, should not be responsible of the PageAction visual state
    //        AND of adding/removing the item from the items list
    toggle: function( tab ) {
      mustDisplayPageAction().then( () => {
        browser.storage.local.get('items').then( ({ items }) => {
          const url = Utility.normalizeUrl(tab.url);
          const matchingItem = Items.find( items, { url: url });

          if( matchingItem ) {
            Items.markAsRead( matchingItem.id );
          } else {
            const addItemOptions = { closeTabId: tab.id };
            Items.addItem( url, tab.title, addItemOptions );
          }
        });
      });
    }
  };
})();


export default PageAction;
