"use strict";

import BugReporter from './bug_reporter.js';
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

  buildErrorObject(errorResponse) {
    const errorObject = {
      httpCode: errorResponse.status,
      error:    undefined,
    };

    switch(errorResponse.status) {
      case 401:
        Logger.error('401: unauthorized');
        errorObject.error = PocketError.UNAUTHORIZED;
        // TODO: Reset data (items, access_token, etc.)
        // TODO: Re-triggers an authentication
        break;
      case 403: {
        const userRemaining = errorResponse.headers.get('X-Limit-User-Remaining');
        if(userRemaining && userRemaining === 0) {
          const delayBeforeReset = errorResponse.headers.get('X-Limit-User-Reset');
          errorObject.error = PocketError.RATE_LIMIT;
          errorObject.resetDelay = delayBeforeReset;
          Logger.error('403: access_denied (rate limit)');
          Logger.error('403: rate limit reset in ' + delayBeforeReset + ' seconds');
        } else {
          Logger.error('403: access_denied (missing permissions)');
          errorObject.error = PocketError.PERMISSIONS;
        }
        break;
      }
      case 404:
        Logger.error('404: trying to reach a non-existing URL');
        errorObject.error = PocketError.UNREACHABLE;
        break;
      default:
        Logger.error( errorResponse.status + ' ERROR');
        errorObject.error = PocketError.GENERIC;
        break;
    }

    return errorObject;
  }

  fetch() {
    return new Promise( (resolve, reject) => {
      fetch(this.url, {
        method:  this.action,
        headers: this.defaultHeaders,
        body:    JSON.stringify(this.params)
      })
        .then(response => {
          Logger.log(`(Request.fetch) response for ${this.url} - ${response.status}`);

          if(response.ok) {
            const data = response.json();
            Logger.log(`Response OK, received data : ${JSON.stringify(data)}`);
            resolve(data);
          } else {
            Logger.error('Response not OK, something went wrong');
            const errorObject = this.buildErrorObject(response);

            // Instead of just logging, send an event back to the UI
            // TODO: since the error object is returned in the promise, I might not need this "send message" anymore
            browser.runtime.sendMessage(errorObject);
            reject(errorObject);
          }
        }).catch(error => {
          BugReporter.captureException(error);

          Logger.error('(Request.fetch) error while reaching the server');
          const errorObject = { error: PocketError.UNREACHABLE };

          // Instead of just logging, send an event back to the UI
          // TODO: since the error object is returned in the promise, I might not need this "send message" anymore
          browser.runtime.sendMessage(errorObject);
          reject(errorObject);
        });
    });
  }
}

export default Request;
