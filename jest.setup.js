if (!chrome.runtime) chrome.runtime = {}
if (!chrome.runtime.id) chrome.runtime.id = "history-delete"

// Providing self.crypto which does not exist in node.js environments
// but is a browser-specific thing
if (typeof self === "undefined") {
  global.self = {} // Define `self` in Node.js
}
if (typeof self.crypto === "undefined") {
  const { randomUUID } = require("crypto") // Use Node.js crypto module
  self.crypto = { randomUUID }
}

// Stub the default return value of getManifest to allow Environment.isDevelopment()
// to run smoothly in the test environment (and without having to stub it for every
// single test that indirectly end up calling Environment)
chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: "1.2.3" })
