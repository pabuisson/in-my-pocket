"use strict";

import Logger from './logger.js';

var ContextMenu = ( function() {
  function enable( id ) {
    chrome.contextMenus.update( id, {
      enabled: true
    });
  }

  function disable( id ) {
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
      Logger.log("Create all right-click entries");
      chrome.contextMenus.create({
        id: ContextMenu.addId,
        title: '✚ Add to Pocket',
        contexts: ['link', 'page']
      });
      chrome.contextMenus.create({
        id: ContextMenu.archiveId,
        title: '✓ Mark as read',
        contexts: ['page']
      });
      chrome.contextMenus.create({
        id: ContextMenu.deleteId,
        title: '𝘅 Delete',
        contexts: ['page']
      });
    },

    destroyEntries: function() {
      Logger.log("Destroy all right-click entries");
      chrome.contextMenus.removeAll();
    },

    setState: function( state ) {
      switch( state ) {
        case ContextMenu.pageAlreadyInPocket:
          disable( ContextMenu.addId );
          enable( ContextMenu.archiveId );
          enable( ContextMenu.deleteId );
          break;
        case ContextMenu.pageNotInPocket:
          enable( ContextMenu.addId );
          disable( ContextMenu.archiveId );
          disable( ContextMenu.deleteId );
          break;
      }
    },

    // If current url is the one of the current tab, will update the available context menus
    setCurrentPageState: function( urlToMatch, state ) {
      browser.tabs.query( { url: urlToMatch, active: true } ).then( function( matchingTabs ) {
        for( const tab of matchingTabs ) {
          Logger.log('Will change current page context menu state for ' + tab.url );
          ContextMenu.setState( state );
        }
      });
    }
  }
})();


export default ContextMenu;
