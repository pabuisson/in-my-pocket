"use strict";

// ---------------

const KeyIdentifier = (function() {
  return {
    isLetter: function(keyCode) {
      return (keyCode >= 65 && keyCode <= 90);
    },

    isDigit: function(keyCode) {
      return (keyCode >= 48 && keyCode <= 57);
    },

    isFKey: function(keyCode) {
      return (keyCode >= 112 && keyCode <= 123);
    }
  };
})();


export default KeyIdentifier;
