global.expect = require('chai').expect
global.sinon = require('sinon')

global.browser = {
  storage: {
    local: {
      get: () => Promise.resolve(),
      set: (obj) => Promise.resolve(),
    },
  },
  runtime: {
    getManifest: () => {},
  },
}
global.window = {
  navigator: {
    platform: "",
  },
}
global.self = {
  crypto: {
    randomUUID: () => {},
  },
}
