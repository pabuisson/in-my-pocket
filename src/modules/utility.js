"use strict"

import BugReporter from "./bug_reporter.js"
import Logger from "./logger.js"

// -------------------------------------

const Utility = (function () {
  const defaultTimeout = 1000

  return {
    debounce: (func, delay) => {
      let timerId

      return function () {
        const context = this
        const args = arguments

        if (timerId) {
          clearTimeout(timerId)
        }

        timerId = setTimeout(function () {
          func.apply(context, args)
          timerId = null
        }, delay || defaultTimeout)
      }
    },

    parseJson: json => {
      let parsedResponse = undefined

      try {
        parsedResponse = JSON.parse(json)
      } catch (error) {
        BugReporter.captureException(error)
        Logger.warn("Invalid JSON: could not parse " + json)
      }

      return parsedResponse
    },

    getParent: function (node, selector) {
      while (node && !node.matches(selector)) node = node.parentElement

      return node
    },

    hasParent: function (node, selector) {
      return Utility.getParent(node, selector) ? true : false
    },

    matchesOrHasParent: function (node, selector) {
      return node.matches(selector) || Utility.hasParent(node, selector)
    },

    getQuery: function (url) {
      if (url.startsWith("about:reader?")) return { url: decodeURIComponent(url.replace("about:reader?url=", "")) }
      if (url.startsWith("https://app.getpocket.com/read/"))
        return { id: url.replace("https://app.getpocket.com/read/", "") }
      return { url: url }
    },

    getPossibleUrls: function ({ id, url }) {
      return [
        url,
        `about:reader?url=${encodeURIComponent(url)}`,
        `https://app.getpocket.com/read/${url}`,
        `https://app.getpocket.com/read/${id}`,
        `https://getpocket.com/read/${id}`,
        new RegExp(`https://getpocket.com/[a-z]+/read/${id}`, "gi"),
      ]
    },

    // Source: https://stackoverflow.com/a/7616484/85076
    // Source: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    hashCode: function (s) {
      let hash = 0
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i)
        hash |= 0 // Convert to 32bit integer
      }

      // Make it always > 0
      return hash >>> 0
    },

    domain: function (url) {
      const link = document.createElement("a")
      link.setAttribute("href", url)
      return link.hostname
    },
  }
})()

export default Utility
