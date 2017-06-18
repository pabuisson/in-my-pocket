"use strict";

// -------------------------------------

// TODO Add all the authentication logic in this module

var Authentication = ( function() {
  return {
    isAuthenticated: function() {
      let promise = new Promise( function( resolve, reject ) {
        browser.storage.local.get('access_token').then( function( { access_token } ) {
          if( access_token ) {
            resolve( access_token );
          } else {
            reject();
          }
        });
      });

      return promise;
    }
  }
})();

export default Authentication

