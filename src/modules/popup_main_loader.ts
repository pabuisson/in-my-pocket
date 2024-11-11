"use strict"

const PopupMainLoader = (function () {
  const mainLoaderComponent = document.querySelector(".main-loader")

  return {
    enable: function () {
      if (mainLoaderComponent) {
        mainLoaderComponent.classList.add("loading")
      }
    },

    disable: function (instantly = true) {
      const timeoutDuration = instantly ? 0 : 1000
      setTimeout(function () {
        if (mainLoaderComponent) {
          mainLoaderComponent.classList.remove("loading")
        }
      }, timeoutDuration)
    },
  }
})()

export default PopupMainLoader
