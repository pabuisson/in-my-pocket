"use strict";

import Logger from './logger.js';
import { PocketError } from './constants.js';

// This module must:
//       1. prepare the request with url, action, success and error callbacks
//       2. TODO: allow developer to add params to the request
//          > prepare request ( method, url, params )
//       3. TODO: allow developer to send the request and then/catch it
//          > send request .then / .catch
var RequestBuilder = ( function() {
  return {
    build: function( url, action, successCallback, errorCallback ) {
      Logger.warn("[warning] RequestBuilder.build has been deprecated");
      Logger.warn("It should be replaced with the new Request class.");

      let request = new XMLHttpRequest();
      let errorObject = {
        httpCode: undefined,
        error:    undefined,
      };

      if( url && ( action == 'GET' || action == 'POST' ) ) {
        request.open( action, url, true );
      }

      //Send the proper header information along with the request
      request.setRequestHeader("Content-type", "application/json; charset=UTF-8");
      request.setRequestHeader("X-Accept", "application/json");

      request.onload = function() {
        if( this.status >= 200 && this.status < 400 ) {
          Logger.log(JSON.parse( this.response));
          if( successCallback ) {
            successCallback( JSON.parse( this.response ));
          }

        } else {
          errorObject.httpCode = this.status;

          switch( this.status ) {
            case 401:
              Logger.error('401: unauthorized');
              errorObject.error = PocketError.UNAUTHORIZED;
              // TODO: Reset data (items, access_token, etc.)
              // TODO: Re-triggers an authentication
              break;
            case 403:
              let userRemaining = this.getResponseHeader('X-Limit-User-Remaining');
              if( userRemaining && userRemaining == 0 ) {
                let delayBeforeReset = this.getResponseHeader('X-Limit-User-Reset');
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
              Logger.error( this.status + ' ERROR');
              errorObject.error = PocketError.GENERIC;
              break;
          };

          // Instead of just logging, send an event back to the UI
          chrome.runtime.sendMessage( errorObject );

          if( errorCallback ) {
            errorCallback();
          }
        }
      };

      // There was a connection error of some sort
      request.onerror = function() {
        Logger.error('error while reaching the server');

        errorObject.httpCode = undefined;
        errorObject.error    = PocketError.UNREACHABLE;

        // Instead of just logging, send an event back to the UI
        chrome.runtime.sendMessage( errorObject )

        if( errorCallback ) {
          errorCallback();
        }
      };

      return request;
    }
  }
})();



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
    // TODO: extract this to a dedicated class/module
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
          Logger.log( [ response.ok, response.status ].join('-') );
          if( response.ok ) {
            let data = response.json();

            Logger.log( data );
            resolve( data );

          } else {
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
          chrome.runtime.sendMessage( errorObject )
          reject( errorObject );
        });
    });

    return fetchPromise;
  }
}



// export default RequestBuilder;
export { RequestBuilder, Request }
