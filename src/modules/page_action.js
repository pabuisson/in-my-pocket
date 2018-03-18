"use strict";

import Logger from './logger.js';
import Settings from './settings.js';
import Items from './items.js';


// -------------------------------------


var PageAction = ( function() {
  function mustDisplayPageAction() {
    let promise = new Promise( ( resolve, reject ) => {
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
        browser.storage.local.get( "items" ).then( function({ items }) {
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

    // TODO: give a list of arguments : tabs ou tabIds and iterate here instead of in backgroundjs
    drawEnabled: function( tabId ) {
      mustDisplayPageAction().then( () => {
        browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-blue.svg" });
        browser.pageAction.setTitle({ tabId, title: "Mark as read" });
      });
    },

    // TODO: give a list of arguments : tabs ou tabIds and iterate here instead of in backgroundjs
    drawDisabled: function( tabId ) {
      mustDisplayPageAction().then( () => {
        browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-grey.svg" });
        browser.pageAction.setTitle({ tabId, title: "Add to pocket" });
      });
    },

    // TODO: Can't I just add this in my public draw methods? so that it would be necessary
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

    toggle: function( tab ) {
      mustDisplayPageAction().then( () => {
        browser.storage.local.get( "items" ).then( function({ items }) {
          // const parsedItems  = Utility.parseJson( items ) || [];
          const matchingItem = Items.find( items, { url: tab.url });

          if( matchingItem ) {
            Items.markAsRead( matchingItem.id );
          } else {
            Items.addItem( tab.url, tab.title );
          }
        });
      });
    }
  };
})();


export default PageAction;
