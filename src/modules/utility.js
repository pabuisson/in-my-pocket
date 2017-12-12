"use strict";

import Logger from './logger.js';

// -------------------------------------


var Utility = ( function() {
  let defaultTimeout = 1000;

  return {
    debounce: ( func, delay ) => {
      var timerId;

      return function() {
        let context = this;
        let args    = arguments;

        if( timerId ) {
          clearTimeout( timerId);
        }

        timerId = setTimeout( function() {
          func.apply( context, args );
          timerId = null;
        }, ( delay || defaultTimeout ) );
      };
    },

    parseJson: ( json ) => {
      let parsedResponse = undefined;

      try {
        parsedResponse = JSON.parse( json );
      } catch( e ) {
        Logger.warn( 'Invalid JSON: could not parse ' + json );
      }

      return parsedResponse;
    }
  };
})();


export default Utility;
