"use strict"

const TextSelectionHandler = (function () {
  let _selection = ""

  return {
    storeSelection: function (selection) {
      _selection = selection
    },
    hasChanged: function (selection) {
      return selection !== "" && selection !== _selection
    },
    isInProgress: function () {
      return !!window.getSelection().toString()
    },
  }
})()

export default TextSelectionHandler
