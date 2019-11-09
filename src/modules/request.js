"use strict";

import Logger from './logger.js';
import { PocketError } from './constants.js';


// -----------------------------------


class Request {
  constructor(action, url, params) {
    this.action  = action;
    this.url     = url;
    this.params  = params;
    this.defaultHeaders = {
      "Content-type": "application/json; charset=UTF-8",
      "X-Accept": "application/json"
    };
  }

  fetch() {
    const errorObject = {
      httpCode: undefined,
      error:    undefined,
    };

    return new Promise( (resolve, reject) => {
      fetch( this.url, {
        method:  this.action,
        headers: this.defaultHeaders,
        body:    JSON.stringify(this.params)
      })
        .then( response => {
          // TODO: Extract this to a separate method, to avoid this long method
          Logger.log(`(Request.fetch) response for ${this.url} - ${response.status}`);

          if(response.ok) {
            const data = response.json();

            Logger.log(`Response OK, received data : ${JSON.stringify(data)}`);
            resolve(data);
          } else {
            Logger.error('Response not OK, something went wrong');
            errorObject.httpCode = response.status;

            switch(response.status) {
              case 401:
                Logger.error('401: unauthorized');
                errorObject.error = PocketError.UNAUTHORIZED;
                // TODO: Reset data (items, access_token, etc.)
                // TODO: Re-triggers an authentication
                break;
              case 403:
                const userRemaining = response.headers.get('X-Limit-User-Remaining');
                if(userRemaining && userRemaining === 0) {
                  const delayBeforeReset = response.headers.get('X-Limit-User-Reset');
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
            }

            // Instead of just logging, send an event back to the UI
            // TODO: since I have the error object returned in the promise,
            //       I might not need this "send message" anymore
            browser.runtime.sendMessage(errorObject);
            reject(errorObject);
          }
        }).catch( () => {
          Logger.error('(Request.fetch) error while reaching the server');

          errorObject.httpCode = undefined;
          errorObject.error    = PocketError.UNREACHABLE;

          // Instead of just logging, send an event back to the UI
          // TODO: since I have the error object returned in the promise,
          //       I might not need this "send message" anymore
          browser.runtime.sendMessage(errorObject);
          reject(errorObject);
        });
    });
  }
}


export default Request;
