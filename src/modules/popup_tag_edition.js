"use strict"

import Utility from "../modules/utility.js"

const PopupTagEdition = (function () {
  function getTagElements(eventTarget) {
    const editedItem = Utility.getParent(eventTarget, ".item")
    const tagElements = editedItem.querySelectorAll(".tags .tag")
    return tagElements
  }

  function getNewTagField(eventTarget) {
    const editedItem = Utility.getParent(eventTarget, ".item")
    const newTagField = editedItem.querySelector(".new-tag")
    return newTagField
  }

  function hasNoTags(eventTarget) {
    return getTagElements(eventTarget).length === 0
  }

  return {
    focusNextTag: function (ev) {
      if (hasNoTags(ev.target)) return

      const tagElements = getTagElements(ev.target)
      const focusedTagIndex = Array.from(tagElements).findIndex(tag => tag == document.activeElement)
      const noTagFocused = focusedTagIndex === -1
      const lastTagFocused = focusedTagIndex === tagElements.length - 1

      if (noTagFocused || lastTagFocused) {
        tagElements[0].focus()
      } else {
        tagElements[focusedTagIndex + 1].focus()
      }
    },

    focusPreviousTag: function (ev) {
      if (hasNoTags(ev.target)) return

      const tagElements = getTagElements(ev.target)
      const focusedTagIndex = Array.from(tagElements).findIndex(tag => tag == document.activeElement)
      const noTagFocused = focusedTagIndex === -1
      const firstTagFocused = focusedTagIndex === 0

      if (noTagFocused || firstTagFocused) {
        tagElements[tagElements.length - 1].focus()
      } else {
        tagElements[focusedTagIndex - 1].focus()
      }
    },

    appendTagToItem: function (ev) {
      if (ev.target.value === "") return

      const editedItem = Utility.getParent(ev.target, ".item")
      const newTag = document.createElement("span")
      newTag.classList.add("tag")
      newTag.setAttribute("tabIndex", -1)
      newTag.textContent = ev.target.value

      const newTagField = getNewTagField(ev.target)
      newTagField.value = ""
      ev.target.dataset.previousValue = ""

      editedItem.querySelector(".tags").insertBefore(newTag, newTagField)
    },

    deleteLastTag: function (ev) {
      if (hasNoTags(ev.target)) return

      const tagElements = getTagElements(ev.target)
      const lastTagElement = tagElements[tagElements.length - 1]
      lastTagElement.parentNode.removeChild(lastTagElement)
    },

    deleteFocusedTagAndFocusPreviousOne: function (ev) {
      if (hasNoTags(ev.target)) return

      const tagElements = getTagElements(ev.target)
      const focusedTagIndex = Array.from(tagElements).findIndex(tag => tag == document.activeElement)
      const focusedElement = tagElements[focusedTagIndex]
      focusedElement.parentNode.removeChild(focusedElement)

      // TODO: this piece of logic is about giving focus to next item and should be moved out of this method
      const deletedLastTag = hasNoTags(ev.target)
      if (deletedLastTag) {
        // Focus the input field to add new tags
        getNewTagField(ev.target).focus()
      } else {
        if (focusedTagIndex === 0) {
          // we deleted tag 0 so we'll give focus to next one, aka tag 1 (which is the new item at index 0)
          tagElements[1].focus()
        } else {
          tagElements[focusedTagIndex - 1].focus()
        }
      }
    },
  }
})()

export default PopupTagEdition
