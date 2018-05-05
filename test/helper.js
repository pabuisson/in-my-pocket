// globals
global.expect = require('chai').expect;
global.sinon  = require('sinon');
global.chrome = {
  runtime: {
    getManifest: () => {}
  }
};
global.browser = {
  storage: {
    local: {
      get: () => Promise.resolve()
    }
  }
};
