"use strict";

import Settings from './settings.js';

// Info and warning are only displayed if debug mode is enabled
// Errors on the other hand are *ALWAYS* displayed in the browser console
var Logger = ( function() {
  const prefix = "IMP | ";

  function isLoggingEnabled() {
    return Settings.init().then( function() {
      const isDebugModeEnabled = Settings.get('debugMode');

      if( isDebugModeEnabled === true ) {
        return isDebugModeEnabled;
      } else {
        return Promise.reject();
      }
    });
  }

  return {
    log: function( message ) {
      isLoggingEnabled().then( function(isEnabled) {
        console.log( prefix + message );
      }).catch( function() {
        // Debug mode is disabled
        // 'catch' needed to avoid throwing error because of unhandled rejected promise
      })
    },
    warn: function( message ) {
      isLoggingEnabled().then( function() {
        console.warn( prefix + message );
      }).catch( function() {
        // Debug mode is disabled
        // 'catch' needed to avoid throwing error because of unhandled rejected promise
      });
    },
    error: function( message ) {
      console.error( prefix + message );
    }
  }
})();


export default Logger
