"use strict"

import Utility from "../modules/utility.js"

const PopupTagEdition = (function () {
  return {
    focusNextTag: function (ev) {
      const editedItem = Utility.getParent(ev.target, ".item")
      const tagElements = editedItem.querySelectorAll(".tags .tag")

      if (tagElements.length === 0) return

      const focusedTagIndex = Array.from(tagElements).findIndex(
        tag => tag == document.activeElement
      )
      const noTagFocused = focusedTagIndex === -1
      const lastTagFocused = focusedTagIndex === tagElements.length - 1
      if (noTagFocused || lastTagFocused) {
        tagElements[0].focus()
      } else {
        tagElements[focusedTagIndex + 1].focus()
      }
    },

    focusPreviousTag: function (ev) {
      const editedItem = Utility.getParent(ev.target, ".item")
      const tagElements = editedItem.querySelectorAll(".tags .tag")

      if (tagElements.length === 0) return

      const focusedTagIndex = Array.from(tagElements).findIndex(
        tag => tag == document.activeElement
      )
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

      const newTagField = editedItem.querySelector(".new-tag")
      newTagField.value = ""
      ev.target.dataset.previousValue = ""

      editedItem.querySelector(".tags").insertBefore(newTag, newTagField)
    },

    deleteLastTag: function (ev) {
      const editedItem = Utility.getParent(ev.target, ".item")
      const tagElements = editedItem.querySelectorAll(".tags .tag")

      if (tagElements.length === 0) return

      const lastTagElement = tagElements[tagElements.length - 1]
      lastTagElement.parentNode.removeChild(lastTagElement)
    },

    deleteFocusedTagAndFocusPreviousOne: function (ev) {
      const editedItem = Utility.getParent(ev.target, ".item")
      const tagElements = editedItem.querySelectorAll(".tags .tag")

      if (tagElements.length === 0) return

      const focusedTagIndex = Array.from(tagElements).findIndex(
        tag => tag == document.activeElement
      )

      const focusedElement = tagElements[focusedTagIndex]
      focusedElement.parentNode.removeChild(focusedElement)

      // TODO: this piece of logic has nothing to do with deleting focused tag,
      // but giving focus to next item. This should be moved out of this method
      const deletedLastTag = tagElements.length === 1
      if (deletedLastTag) {
        editedItem.querySelector(".new-tag").focus()
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
