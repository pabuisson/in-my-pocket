"use strict"

// ----------------

const FlashKind = {
  ERROR: "error",
  NOTICE: "notice",
  SUCCESS: "success",
}

const PopupFlash = (function () {
  const flashContainer = document.querySelector(".flash-overlay")

  return {
    isVisible: function () {
      return !flashContainer.classList.contains("hidden")
    },

    isNeedResyncMessageVisibleDisplayed: function () {
      return PopupFlash.isVisible() && flashContainer.innerHTML.includes("refresh")
    },

    show: function (message, flashClass, delay) {
      flashContainer.classList.remove(Object.values(FlashKind))
      flashContainer.classList.add(flashClass)
      flashContainer.innerHTML = message
      flashContainer.classList.remove("hidden")

      if (delay) {
        setTimeout(() => {
          flashContainer.classList.add("hidden")
        }, delay)
      }
    },

    showNeedResyncMessage: function () {
      const flashMessage = `
        This version of IMP needs to refresh all your items.
        To make sure everythings works smoothly,
        <strong>please click the 🔄 icon above this message.</strong>
      `

      PopupFlash.show(flashMessage, FlashKind.ERROR)
    },
  }
})()

export { PopupFlash, FlashKind }
