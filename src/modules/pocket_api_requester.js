"use strict";

import Logger from './logger.js';
import Request from './request.js';
import { consumerKey } from './constants.js';


// ---------------


class PocketApiRequester {
  constructor( accessToken ) {
    this.accessToken = accessToken;
  }

  add(item) {
    Logger.log('(PocketApiRequester.add)');
    const requestUrl = 'https://getpocket.com/v3/add';
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      url:   item.url,
      title: item.title
    };

    const request = new Request( 'POST', requestUrl, requestParams );
    return request.fetch();
  }

  addBatch(items) {
    Logger.log('(PocketApiRequester.addBatch)');
    const requestUrl = 'https://getpocket.com/v3/send';
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: items.map(item => {
        return {
          action: 'add',
          url: item.url,
          title: item.title
        }
      })
    };

    const request = new Request( 'POST', requestUrl, requestParams );
    return request.fetch();
  }

  archive( itemId ) {
    Logger.log('(PocketApiRequester.archive)');
    const requestUrl = 'https://getpocket.com/v3/send';
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [
        { action: 'archive', item_id: itemId }
      ]
    };

    const request = new Request( 'POST', requestUrl, requestParams );
    return request.fetch();
  }

  delete( itemId ) {
    Logger.log('(PocketApiRequester.delete)');
    const requestUrl = 'https://getpocket.com/v3/send';
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      actions: [
        { action: 'delete', item_id: itemId }
      ]
    };

    const request = new Request( 'POST', requestUrl, requestParams );
    return request.fetch();
  }
}

export default PocketApiRequester;
