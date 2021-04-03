"use strict"

const BrowserDetector = (function () {
  return {
    browserName: async function () {
      if (browser.runtime.getBrowserInfo) {
        const browserInfo = await browser.runtime.getBrowserInfo()
        return browserInfo.name
      } else {
        return "Unknown"
      }
    },
  }
})()

export default BrowserDetector
