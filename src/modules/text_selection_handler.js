"use strict"

import { TextSelectionState } from "../modules/constants.js"

const TextSelectionHandler = (function () {
  let textSelectionState = TextSelectionState.NOT_STARTED

  function setTextSelectionStatus(value) {
    textSelectionState = value
  }

  function getTextSelectionStatus() {
    return textSelectionState
  }

  return {
    markAsStarted: function () {
      setTextSelectionStatus(TextSelectionState.IN_PROGRESS)
    },

    markAsFinished: function () {
      setTextSelectionStatus(TextSelectionState.NOT_STARTED)
    },

    isInProgress: function () {
      return getTextSelectionStatus() === TextSelectionState.IN_PROGRESS
    },
  }
})()

export default TextSelectionHandler
