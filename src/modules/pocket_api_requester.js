"use strict";

import Logger from './logger.js';
import Request from './request.js';
import { consumerKey } from './constants.js';


// ---------------


class PocketApiRequester {
  constructor( accessToken ) {
    this.accessToken = accessToken;
  }

  add( url, title ) {
    Logger.log('(PocketApiRequester.add)');
    const requestUrl = 'https://getpocket.com/v3/add';
    const requestParams = {
      consumer_key: consumerKey,
      access_token: this.accessToken,
      url:   url,
      title: title
    };

    let request = new Request( 'POST', requestUrl, requestParams );
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

    let request = new Request( 'POST', requestUrl, requestParams );
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

    let request = new Request( 'POST', requestUrl, requestParams );
    return request.fetch();
  }
}

export default PocketApiRequester;
