"use strict";

import Logger from './logger.js';


// -------------------------------------


// TODO Add all the authentication logic in this module

var Authentication = ( function() {
  return {
    isAuthenticated: function() {
      let promise = new Promise( function( resolve, reject ) {
        browser.storage.local.get('access_token').then( function( { access_token } ) {
          if( access_token ) {
            Logger.log( '(Authentication.isAuthenticated) access_token present, user is authenticated' );
            resolve( access_token );
          } else {
            Logger.warn( '(Authentication.isAuthenticated) access_token missing, user is not authenticated' );
            reject();
          }
        });
      });

      return promise;
    }
  }
})();

export default Authentication;
