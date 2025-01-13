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
