"use strict"

const TextSelectionHandler = (function () {
  let _selection: string = ""

  return {
    storeSelection: function (selection: string) {
      _selection = selection
    },

    hasChanged: function (selection: string): boolean {
      return selection !== "" && selection !== _selection
    },

    isInProgress: function (): boolean {
      // @ts-ignore
      return !!window.getSelection().toString()
    },
  }
})()

export default TextSelectionHandler
