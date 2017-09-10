"use strict";


// -------------------------------------


var PageAction = ( function() {
  return {
    redraw: function( tabId, url ) {
      browser.storage.local.get( "items" ).then( function({ items }) {
        const parsedItems  = JSON.parse( items );
        const containsItem = parsedItems.some( i => i.resolved_url == url );

        if( containsItem ) {
          PageAction.drawEnabled( tabId );
        } else {
          PageAction.drawDisabled( tabId );
        }

        PageAction.show(tabId);
      });
    },

    redrawAllTabs: function() {
      browser.tabs.query( {} ).then( function( tabs ) {
        for( const tab of tabs ) {
          if( tab.url ) {
            PageAction.redraw( tab.id, tab.url );
          }
        }
      });
    },

    drawEnabled: function( tabId ) {
      browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-blue.svg" });
      browser.pageAction.setTitle({ tabId, title: "Mark as read" });
    },

    drawDisabled: function( tabId ) {
      browser.pageAction.setIcon( { tabId, path: "assets/icons/inmypocket-flat-grey.svg" });
      browser.pageAction.setTitle({ tabId, title: "Add to pocket" });
    },

    // TODO: Can't I just add this in my public draw methods? so that it would be necessary
    //       to manually call this each time I draw some page actions
    show: function( tabId ) {
      browser.pageAction.show( tabId );
    },

    // TODO: Instead of using callbacks, puts those markAsRead/addItem method in their own
    //       module, and call this module from here
    toggle: function( tab, markAsRead, addItem ) {
      browser.storage.local.get( "items" ).then( function({ items }) {
        const parsedItems  = JSON.parse( items );
        const matchingItem = parsedItems.find( i => i.resolved_url == tab.url );

        if( matchingItem ) {
          markAsRead( matchingItem.id );
        } else {
          addItem( tab.url, tab.title );
        }
      });
    }
  }
})();


export default PageAction
