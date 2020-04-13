"use strict";

import Logger from './logger.js';

// -------------------------------------

const Utility = (function () {
  const defaultTimeout = 1000;

  return {
    debounce: (func, delay) => {
      let timerId;

      return function () {
        const context = this;
        const args = arguments;

        if (timerId) {
          clearTimeout(timerId);
        }

        timerId = setTimeout(function () {
          func.apply(context, args);
          timerId = null;
        }, (delay || defaultTimeout));
      };
    },

    parseJson: (json) => {
      let parsedResponse = undefined;

      try {
        parsedResponse = JSON.parse(json);
      } catch (e) {
        Logger.warn('Invalid JSON: could not parse ' + json);
      }

      return parsedResponse;
    },

    getParent: function (node, selector) {
      while (node && !node.matches(selector))
        node = node.parentElement;

      return node;
    },

    hasParent: function (node, selector) {
      return (Utility.getParent(node, selector) ? true : false);
    },

    matchesOrHasParent: function (node, selector) {
      return node.matches(selector) || Utility.hasParent(node, selector);
    },

    getQuery: function(url) {
      if (url.startsWith('about:reader?'))
        return {url: decodeURIComponent(url.replace('about:reader?url=', ''))};
      if (url.startsWith('https://app.getpocket.com/read/'))
        return {id: url.replace('https://app.getpocket.com/read/', '')};
      // is there still a way to use old webapp? if not it's unnecessary
      if (url.startsWith('https://getpocket.com/a/read/'))
        return {id: url.replace('https://getpocket.com/a/read/', '')};
      return {url: url};
    },

    getPossibleUrls: function({ id, url }) {
      return [
        url,
        'about:reader?url=' + encodeURIComponent(url),
        'https://app.getpocket.com/read/' + url,
        'https://app.getpocket.com/read/' + id,
        // is there still a way to use old webapp? if not it's unnecessary
        'https://getpocket.com/a/read/' + url,
        'https://getpocket.com/a/read/' + id,
      ];
    }
  };
})();

export default Utility;
