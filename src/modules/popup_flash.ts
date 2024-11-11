"use strict"

const FlashKind = {
  ERROR: "error",
  NOTICE: "notice",
  SUCCESS: "success",
}

const PopupFlash = (function () {
  const flashContainer = document.querySelector(".flash-overlay")

  return {
    isVisible: function () {
      if (flashContainer) {
        return !flashContainer.classList.contains("hidden")
      } else {
        return false
      }
    },

    isNeedResyncMessageDisplayed: function () {
      return (
        // @ts-ignore
        PopupFlash.isVisible() && flashContainer.innerHTML.includes("refresh")
      )
    },

    // TODO: flashClass should actually be of "FlashKind values" type
    show: (message: string, flashClass: string, delay?: number) => {
      if (!flashContainer) return

      flashContainer.classList.remove(...Object.values(FlashKind))
      flashContainer.classList.add(flashClass)
      flashContainer.textContent = message
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
        <strong>please click the 🔄 icon above this message</strong>
      `

      PopupFlash.show(flashMessage, FlashKind.ERROR)
    },
  }
})()

export { PopupFlash, FlashKind }
