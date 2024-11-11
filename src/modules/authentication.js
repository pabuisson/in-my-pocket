"use strict"

import Logger from "./logger"
import Request from "./request.js"
import { consumerKey } from "./constants.js"

// -------------------------------------

const Authentication = (function () {
  const redirectIntermediate = "https://oauth.pabuisson.com"
  const redirectAuthFinished = "https://oauth.pabuisson.com"

  function authenticateStep2(requestToken) {
    Logger.log("(Authentication.authenticateStep2) Request API authorize to finish authentication")
    const requestParams = {
      consumer_key: consumerKey,
      code: requestToken,
    }

    return new Request("POST", "https://getpocket.com/v3/oauth/authorize", requestParams)
      .fetch()
      .then(function (response) {
        Logger.log("(Authentication.authenticateStep2) Got the access_token, we are all good!")
        browser.storage.local.set({ access_token: response.access_token })

        return true
      })
  }

  return {
    authenticate: function () {
      Logger.log("(Authentication.authenticate) Starting the authentication process")
      const promise = new Promise((resolve, reject) => {
        const requestParams = {
          consumer_key: consumerKey,
          redirect_uri: redirectAuthFinished,
        }

        Logger.log("(Authentication.authenticate) Requesting the requestToken")
        new Request("POST", "https://getpocket.com/v3/oauth/request", requestParams).fetch().then(response => {
          Logger.log("(Authentication.authenticate) Got the requestToken, open an authorize tab")
          const requestToken = response.code
          const authorizeUrl = `https://getpocket.com/auth/authorize?request_token=${requestToken}&redirect_uri=${redirectIntermediate}`

          browser.tabs.create({ url: authorizeUrl }).then(_tab => {
            browser.tabs.onUpdated.addListener((tabId, changeInfo, updatedTab) => {
              // callback url has been loaded
              if (changeInfo.status == "complete" && updatedTab.url.indexOf(redirectIntermediate) === 0) {
                Logger.log("(Authentication.authenticate) Authorize tab loaded correctly")
                browser.tabs.remove(tabId)

                authenticateStep2(requestToken).then(resolve).catch(reject)
              }
            })
          })
        })
      })

      return promise
    },

    isAuthenticated: function () {
      const promise = new Promise((resolve, reject) => {
        browser.storage.local.get("access_token").then(({ access_token }) => {
          if (access_token) {
            Logger.log("(Authentication.isAuthenticated) access_token present, authenticated")
            resolve(access_token)
          } else {
            Logger.warn("(Authentication.isAuthenticated) access_token missing, not authenticated")
            reject()
          }
        })
      })

      return promise
    },
  }
})()

export default Authentication
