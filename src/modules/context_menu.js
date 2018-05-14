"use strict";

import Logger from './logger.js';

var ContextMenu = ( function() {
  function enable( id ) {
    Logger.log( '(ContextMenu.enable) enable ' + id + ' context menu');
    chrome.contextMenus.update( id, {
      enabled: true
    });
  }

  function disable( id ) {
    Logger.log( '(ContextMenu.enable) disable ' + id + ' context menu');
    chrome.contextMenus.update( id, {
      enabled: false
    });
  }

  return {
    addId:     'inmypocket-add-item',
    archiveId: 'inmypocket-archive-item',
    deleteId:  'inmypocket-delete-item',

    // TODO: this state should not be defined here, but in another module
    //       A dedicated PageState module? Or a more "Item"-oriented module?
    pageAlreadyInPocket: 'PAGE_ALREADY_IN_POCKET',
    pageNotInPocket:     'PAGE_NOT_IN_POCKET',

    createEntries: function() {
      Logger.log( '(ContextMenu.createEntries) create all right-click entries' );
      chrome.contextMenus.create({
        id: ContextMenu.addId,
        title: 'Add to Pocket',
        contexts: ['link', 'page'],
        icons: {
          16: 'assets/icons/ionicons-android-add-circle.svg'
        }
      });
      chrome.contextMenus.create({
        id: ContextMenu.archiveId,
        title: 'Mark as read',
        contexts: ['page'],
        icons: {
          16: 'assets/icons/ionicons-checkmark.svg'
        }
      });
      chrome.contextMenus.create({
        id: ContextMenu.deleteId,
        title: 'Delete',
        contexts: ['page'],
        icons: {
          16: 'assets/icons/ionicons-trash-b.svg'
        }
      });
    },

    destroyEntries: function() {
      Logger.log( '(ContextMenu.destroyEntries) destroy all right-click entries' );
      chrome.contextMenus.removeAll();
    },

    setState: function( state ) {
      switch( state ) {
        case ContextMenu.pageAlreadyInPocket:
          enable( ContextMenu.addId );    // always enabled, for click on link to remain possible
          enable( ContextMenu.archiveId );
          enable( ContextMenu.deleteId );
          break;
        case ContextMenu.pageNotInPocket:
          enable( ContextMenu.addId );    // always enabled
          disable( ContextMenu.archiveId );
          disable( ContextMenu.deleteId );
          break;
      }
    },

    // If current url is the one of the current tab, will update the available context menus
    setCurrentPageState: function( urlToMatch, state ) {
      browser.tabs.query( { url: urlToMatch, active: true } ).then( matchingTabs => {
        for( const tab of matchingTabs ) {
          Logger.log( '(ContextMenu.setCurrentPageState) change current page context menu state to ' + state + ' for ' + tab.url );
          ContextMenu.setState( state );
        }
      });
    }
  };
})();


export default ContextMenu;
