"use strict";

const Browser = ( function() {
  return {
    isChrome() {
      return navigator.userAgent.includes('Chrome/');
    }
  };
})();

export default Browser;
