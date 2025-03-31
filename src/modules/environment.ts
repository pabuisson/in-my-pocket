"use strict"

import browser from "webextension-polyfill"

const Environment = {
  // NOTE: same color as the .row.warning background-color in the options page
  DEV_MODE_COLOR: "#fcab10",

  // 1.1.1 is a production version
  // 2.2.2.2 is a development version
  isDevelopment: function () {
    return browser.runtime.getManifest().version.split(".").length > 3
  },
}

export default Environment
