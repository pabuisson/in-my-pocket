"use strict";

import Logger from './logger.js';
import { PocketError } from './constants.js';
import Utility from './utility.js';

// -----------------------------------

class Request {
  constructor( action, url, params ) {
    this.action  = action;
    this.url     = url;
    this.params  = params;
    this.defaultHeaders = {
      "Content-type": "application/json; charset=UTF-8",
      "X-Accept": "application/json"
    };
  }

  fetch() {
    // TODO: extract to a dedicated class/module
    let errorObject = {
      httpCode: undefined,
      error:    undefined,
    };

    let fetchPromise = new Promise( ( resolve, reject ) => {
      fetch( this.url, {
        method:  this.action,
        headers: this.defaultHeaders,
        body:    JSON.stringify( this.params )
      })
        .then( response => {
          // TODO: Extract this to a separate method, to avoid this long method
          Logger.log( '(Request.fetch) response for ' + this.url + ' -  ' + response.status );

          if( response.ok ) {
            let data = response.json();

            Logger.log( 'response OK, received data : ');
            Logger.log( data );
            resolve( data );

          } else {
            Logger.error( 'response is wrong');
            errorObject.httpCode = response.status;

            switch( response.status ) {
              case 401:
                Logger.error('401: unauthorized');
                errorObject.error = PocketError.UNAUTHORIZED;
                // TODO: Reset data (items, access_token, etc.)
                // TODO: Re-triggers an authentication
                break;
              case 403:
                let userRemaining = response.headers.get('X-Limit-User-Remaining');
                if( userRemaining && userRemaining == 0 ) {
                  let delayBeforeReset = response.headers.get('X-Limit-User-Reset');
                  errorObject.error = PocketError.RATE_LIMIT;
                  errorObject.resetDelay = delayBeforeReset;
                  Logger.error('403: access_denied (rate limit)');
                  Logger.error('403: rate limit reset in ' + delayBeforeReset + ' seconds');
                } else {
                  Logger.error('403: access_denied (missing permissions)');
                  errorObject.error = PocketError.PERMISSIONS;
                }
                break;
              case 404:
                Logger.error('404: trying to reach a non-existing URL');
                errorObject.error = PocketError.UNREACHABLE;
                break;
              default:
                Logger.error( response.status + ' ERROR');
                errorObject.error = PocketError.GENERIC;
                break;
            };

            // Instead of just logging, send an event back to the UI
            // TODO: since I have the error object returned in the promise,
            //       I might not need this "send message" anymore
            chrome.runtime.sendMessage( errorObject );
            reject( errorObject );
          }
        }).catch( error => {
          // TODO: Extract this to a separate method, to avoid this long method
          Logger.error('(Request.fetch) error while reaching the server');

          errorObject.httpCode = undefined;
          errorObject.error    = PocketError.UNREACHABLE;

          // Instead of just logging, send an event back to the UI
          // TODO: since I have the error object returned in the promise,
          //       I might not need this "send message" anymore
          chrome.runtime.sendMessage( errorObject );
          reject( errorObject );
        });
    });

    return fetchPromise;
  }
}


export default Request;
