"use strict"

import BugReporter from "./bug_reporter.js"
import Logger from "./logger.js"
import { PocketError } from "./constants.js"

// -----------------------------------

class Request {
  constructor(action, url, params) {
    this.action = action
    this.url = url
    this.params = params
    this.defaultHeaders = {
      "Content-type": "application/json; charset=UTF-8",
      "X-Accept": "application/json",
    }
  }

  buildErrorObject(errorResponse) {
    const errorObject = {
      error: undefined,
      url: this.url,
      httpCode: errorResponse.status,
    }

    switch (errorResponse.status) {
      case 401:
        Logger.error("401: unauthorized")
        errorObject.error = PocketError.UNAUTHORIZED
        // TODO: Reset data (items, access_token, etc.)
        // TODO: Re-triggers an authentication
        break
      case 403: {
        const userRemaining = errorResponse.headers.get("X-Limit-User-Remaining")
        if (userRemaining && userRemaining === 0) {
          const delayBeforeReset = errorResponse.headers.get("X-Limit-User-Reset")
          Logger.error("403: access_denied (rate limit)")
          Logger.error(`403: rate limit reset in ${delayBeforeReset} seconds`)
          errorObject.error = PocketError.RATE_LIMIT
          errorObject.resetDelay = delayBeforeReset
        } else {
          Logger.error("403: access_denied (missing permissions)")
          errorObject.error = PocketError.PERMISSIONS
        }
        break
      }
      case 404:
        Logger.error("404: trying to reach a non-existing URL")
        errorObject.error = PocketError.NOT_FOUND
        break
      case 504:
        Logger.error("504: timeout")
        errorObject.error = PocketError.TIMEOUT
        break
      default:
        Logger.error(`${errorResponse.status} http error`)
        errorObject.error = PocketError.UNKNOWN
        break
    }

    return errorObject
  }

  fetch() {
    return new Promise((resolve, reject) => {
      fetch(this.url, {
        method: this.action,
        headers: this.defaultHeaders,
        body: JSON.stringify(this.params),
      })
        .then(response => {
          Logger.log(`(Request.fetch) response for ${this.url} - ${response.status}`)

          if (response.ok) {
            const data = response.json()
            Logger.log(`(Request.fetch) Response OK, received data : ${JSON.stringify(data)}`)
            resolve(data)
          } else {
            Logger.error("(Request.fetch) Response not OK, something went wrong")
            const errorDetails = this.buildErrorObject(response)

            // Error details are passed as tags
            // Use "captureMessage" + tags to group all HTTP errors in one single sentry
            BugReporter.captureMessage("HTTP response not OK", null, errorDetails)

            // Send an event back to the UI
            browser.runtime.sendMessage(errorDetails)
            reject(errorDetails)
          }
        })
        .catch(error => {
          // NOTE: in which case do we get into the catch (instead of a then + !ok)?
          BugReporter.captureException(new Error("Request.fetch: promise rejected"), error)

          Logger.error("(Request.fetch) error while reaching the server or processing the response")
          const errorDetails = { error: PocketError.GENERIC }

          // Send an event back to the UI
          browser.runtime.sendMessage(errorDetails)
          reject(errorDetails)
        })
    })
  }
}

export default Request
