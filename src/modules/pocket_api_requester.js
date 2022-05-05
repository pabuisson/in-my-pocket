"use strict"

import FeatureSwitches from "./feature_switches.js"
import Logger from "./logger.js"
import Request from "./request.js"
import { consumerKey } from "./constants.js"

// ---------------

class PocketApiRequester {
  constructor(accessToken) {
    this.accessToken = accessToken
  }

  add(item) {
    Logger.log("(PocketApiRequester.add)")
    const requestUrl = "https://getpocket.com/v3/add"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      url: item.url,
      title: item.title,
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  addBatch(items) {
    Logger.log("(PocketApiRequester.addBatch)")
    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: items.map(item => {
        return {
          action: "add",
          url: item.url,
          title: item.title,
        }
      }),
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  archive(itemId) {
    Logger.log("(PocketApiRequester.archive)")
    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [{ action: "archive", item_id: itemId }],
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  delete(itemId) {
    Logger.log("(PocketApiRequester.delete)")
    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [{ action: "delete", item_id: itemId }],
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  favorite(itemId) {
    Logger.log("(PocketApiRequester.favorite)")
    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [{ action: "favorite", item_id: itemId }],
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  unfavorite(itemId) {
    Logger.log("(PocketApiRequester.unfavorite)")
    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [
        {
          action: "unfavorite",
          item_id: itemId,
        },
      ],
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }

  update(itemId, { title, tags = [], previousTags = [], url, created_at }) {
    Logger.log(`(PocketApiRequester.update) ${itemId} - ${title} - ${tags} - ${url}`)
    // NOTE: by default, it touches both the time_added and time_updated timestamp on the items
    // and therefore it fucks my items sorting completely
    // if I pass the initial creation time, then the creation time remains the same and the update
    // time is correctly updated. Misleading but it works
    const actions = [
      {
        action: "add",
        item_id: itemId,
        title: title,
        url: url,
        time: created_at,
      },
    ]

    const addedTags = tags.filter(tag => !previousTags.includes(tag))
    const removedTags = previousTags.filter(previousTag => !tags.includes(previousTag))

    if (addedTags.length > 0) {
      actions.push({
        action: "tags_add",
        item_id: itemId,
        tags: addedTags,
      })
    }

    if (removedTags.length > 0) {
      actions.push({
        action: "tags_remove",
        item_id: itemId,
        tags: removedTags,
      })
    }

    const requestUrl = "https://getpocket.com/v3/send"
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: actions,
    }

    const request = new Request("POST", requestUrl, requestParams)
    return request.fetch()
  }
}

export default PocketApiRequester
