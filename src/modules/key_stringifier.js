"use strict"

import KeyIdentifier from "./key_identifier.js"

// ---------------

const KeyStringifier = (function () {
  return {
    stringifyCtrlKey: function (ev) {
      if (ev.ctrlKey === false) return ""

      if (window.navigator.platform.includes("Mac")) return "MacCtrl"
      else return "Ctrl"
    },

    stringifyKey: function (ev) {
      const keyCode = ev.which || ev.keyCode || 0
      let char = ""

      if (KeyIdentifier.isLetter(keyCode) || KeyIdentifier.isDigit(keyCode)) {
        char = String.fromCharCode(keyCode)
      } else if (KeyIdentifier.isFKey(keyCode)) {
        char = ev.key
      }

      return char.toUpperCase()
    },
  }
})()

export default KeyStringifier
