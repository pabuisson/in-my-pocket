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

    isMajorOrMinorUpdate: (baseVersion) => {
      const currentVersion = browser.runtime.getManifest().version;
      const [currentMajor, currentMinor] = currentVersion.split('.').slice(0, 2);
      const [baseMajor, baseMinor] = baseVersion.split('.').slice(0, 2);

      if(currentMajor > baseMajor) {
        return true;
      } else if(currentMajor < baseMajor) {
        return false;
      } else {
        return currentMinor > baseMinor;
      }
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

    getQuery(url) {
      if (url.startsWith('about:reader?'))
        return {url: decodeURIComponent(url.replace('about:reader?url=', ''))};
      if (url.startsWith('https://app.getpocket.com/read/'))
        return {id: url.replace('https://app.getpocket.com/read/', '')};
      // is there still a way to use old webapp? if not it's unnecessary
      if (url.startsWith('https://getpocket.com/a/read/'))
        return {id: url.replace('https://getpocket.com/a/read/', '')};
      return {url: url};
    },

    getPossibleUrls(item) {
      return [
        item.url,
        'about:reader?url=' + encodeURIComponent(item.url),
        'https://app.getpocket.com/read/' + item.url,
        'https://app.getpocket.com/read/' + item.id,
        // is there still a way to use old webapp? if not it's unnecessary
        'https://getpocket.com/a/read/' + item.url,
        'https://getpocket.com/a/read/' + item.id,
      ];


    }


  };
})();


export default Utility;
