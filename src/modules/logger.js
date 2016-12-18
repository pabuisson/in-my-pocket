"use strict";

const Environments = {
  PRODUCTION:   'production',
  DEVELOPMENT:  'development'
};


var Logger = ( function() {
  let prefix = "INMYPOCKET | ";
  // const currentEnvironment = Environments.DEVELOPMENT;
  const currentEnvironment = Environments.PRODUCTION;

  return {
    log: function( message ) {
      if( currentEnvironment == Environments.DEVELOPMENT ) {
        console.log( prefix + message );
      }
    },
    warn: function( message ) {
      console.warn( prefix + message );
    },
    error: function( message ) {
      console.error( prefix + message );
    }
  }
})();


export default Logger
