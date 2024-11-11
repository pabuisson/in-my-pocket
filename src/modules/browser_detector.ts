"use strict"

const BrowserDetector = (function () {
  return {
    browserName: async function (): Promise<string> {
      // @ts-ignore
      if (browser.runtime.getBrowserInfo) {
        // @ts-ignore
        const browserInfo = await browser.runtime.getBrowserInfo()
        return browserInfo.name
      } else {
        return "Unknown"
      }
    },
  }
})()

export default BrowserDetector
