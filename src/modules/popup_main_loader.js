"use strict";

var PopupMainLoader = ( function() {
  let mainLoaderComponent = document.querySelector( '.main-loader' );

  return {
    enable: function() {
      mainLoaderComponent.classList.add('loading');
    },

    disable: function( instantly = true ) {
      let timeoutDuration = ( instantly ? 0 : 1000 );
      setTimeout( function() {
        mainLoaderComponent.classList.remove('loading');
      }, timeoutDuration );
    }
  };
})();

export default PopupMainLoader;
