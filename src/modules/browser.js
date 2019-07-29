"use strict";

const Browser = (function() {
  return {
    // For now, we can suppose that every non-firefox browser is Chrome based (and that all those
    // browsers behave the same way)
    isChromeBased: function() {
      return !Browser.isFirefoxBased();
    },

    isFirefoxBased: function() {
      return navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("PaleMoon");
    }
  };
})();

export default Browser;
