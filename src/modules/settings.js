"use strict";

var Settings = ( function() {
  let _loaded  = false;
  let settings = {};
  let defaultSettings = {
    showBadge: true,
    openInNewTab: true
  };

  function load() {
    let promise = new Promise( function( resolve, reject ) {
      browser.storage.local.get( 'settings', function( data ) {
        _loaded  = true;

        settings = Object.assign( settings, defaultSettings );
        if( data.settings ) {
          settings = Object.assign( settings, JSON.parse( data.settings ) );
        }

        resolve();
      });
    });

    return promise;
  }


  return {
    init: function() {
      return load();
    },

    get: function( key ) {
      if( _loaded ) {
        if( key ) {
          return settings[ key ];
        } else {
          return settings;
        }
      }

      return undefined;
    },

    set: function( key, value ) {
      if( _loaded ) {
        settings[ key ] = value;
        return true;
      }

      return false;
    },

    save: function() {
      // If settings not yet loaded, we don't need to save them (they can't have
      // been modified since they've not even been loaded
      if( _loaded ) {
        browser.storage.local.set({ settings: JSON.stringify( settings ) });
        return true;
      }

      return false;
    }
  };
})();


export default Settings
