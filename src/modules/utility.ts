"use strict"

import BugReporter from "./bug_reporter"
import Logger from "./logger"

// -------------------------------------

const Utility = (function () {
  const defaultTimeout = 1000

  return {
    debounce: (func: Function, delay: number) => {
      let timerId: NodeJS.Timeout | null

      return function () {
        // @ts-ignore
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

    parseJson: (json: string) => {
      let parsedResponse = undefined

      try {
        parsedResponse = JSON.parse(json)
      } catch (error) {
        const errorDetails = {
          jsonWasAnEmptyString: json === "",
          jsonWasUndefined: json === undefined,
          jsonWasNull: json === null,
        }
        BugReporter.captureException(error, errorDetails)
        Logger.warn("Invalid JSON: could not parse " + json)
      }

      return parsedResponse
    },

    getParent: function (node: HTMLElement, selector: string) {
      // @ts-ignore
      while (node && !node.matches(selector)) node = node.parentElement

      return node
    },

    hasParent: function (node: HTMLElement, selector: string): boolean {
      return Utility.getParent(node, selector) ? true : false
    },

    matchesOrHasParent: function (node: HTMLElement, selector: string) {
      return node.matches(selector) || Utility.hasParent(node, selector)
    },

    // FIXME: browser.tabs.query can't deal with RegExp. As a consequence, I had to
    // exclude the RegExp from all places we used this function to pass a list of URLs
    // to browser.tabs.query... even though the RegExp-ed version of the URL should
    // also be taken into account to update page action and such.
    // TODO: ID should be a common type
    // FIXME: ID should not be either a string or a number, only of those two
    getPossibleUrls: function ({
      id,
      url,
    }: {
      id: string | number
      url: string
    }) {
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
    hashCode: function (s: string) {
      let hash = 0
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i)
        hash |= 0 // Convert to 32bit integer
      }

      // Make it always > 0
      return hash >>> 0
    },

    domain: function (url: string) {
      const link = document.createElement("a")
      link.setAttribute("href", url)
      return link.hostname
    },

    getType: function (value: any) {
      if (value === null) {
        return "null"
      } else if (Array.isArray(value)) {
        // NOTE: typeof an array == "object" so we need to handle this case separately
        return `Array(${value.length})`
      } else {
        return typeof value
      }
    },
  }
})()

export default Utility
