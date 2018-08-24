"use strict";

import Logger   from './logger.js';
import PopupUI  from './popup_ui.js';
import Settings from './settings.js';
import Utility  from './utility.js';

// ---------------

var PopupPagination = ( function() {
  const paginationContainer          = document.querySelector( '.pagination' );
  const paginationNextPageButton     = document.querySelector( '.pagination-next');
  const paginationPageSelector       = document.querySelector( '.pagination-page-selector' );
  const paginationPreviousPageButton = document.querySelector( '.pagination-previous');

  // Pagination event handlers and UI building

  function previousPageEventListener() {
    browser.storage.local.get('display').then( ({ display }) => {
      const parsedDisplay  = Utility.parseJson( display ) || {};
      const currentPage = display ? parsedDisplay.currentPage : 1;

      Logger.log(`(PopupPagination) Load previous page: from ${ currentPage } to ${ currentPage - 1 }`);
      PopupUI.drawList({ page: currentPage - 1 });
    });
  }

  function nextPageEventListener() {
    browser.storage.local.get('display').then( ({ display }) => {
      const parsedDisplay  = Utility.parseJson( display ) || {};
      const currentPage = display ? parsedDisplay.currentPage : 1;

      Logger.log(`(PopupPagination) Load next page: from ${ currentPage } to ${ currentPage + 1 }`);
      PopupUI.drawList({ page: currentPage + 1 });
    });
  }

  function changePageEventListener( event ) {
    let pageToLoad = parseInt( event.target.value );

    Logger.log(`(PopupPagination) Load page ${ pageToLoad }`);
    PopupUI.drawList({ page: pageToLoad });
  }

  // ---------------

  function buildPageSelector(perPage, itemsCount) {
    if(!perPage) {
      return;
    }

    // Empty the pagination selector
    while(paginationPageSelector.firstChild) {
      paginationPageSelector.removeChild(paginationPageSelector.firstChild);
    }

    // Recreate all the options
    const pagesCount = Math.ceil(itemsCount / perPage) || 1;
    for(let i = 0; i < pagesCount; i++) {
      let option = document.createElement('option');
      option.setAttribute('value', i + 1 );
      option.innerText = `${ i + 1 } / ${ pagesCount }`;

      paginationPageSelector.appendChild(option);
    }

    // By default, the selector is hidden until it's completely built
    paginationPageSelector.style.display = 'inline-block';
  }

  function setCurrentPage(currentPage) {
    paginationPageSelector.value = currentPage;
  }

  function disableButton(element, handler) {
    element.classList.add('disabled');
    element.removeEventListener('click', handler);
  }

  function enableButton(element, handler) {
    element.classList.remove('disabled');
    element.addEventListener('click', handler);
  }

  function updateButtonsState(page, perPage, itemsCount) {
    const pagesCount = Math.ceil(itemsCount / perPage);

    if(pagesCount == 0 || pagesCount == 1) {
      Logger.log(`(PopupPagination.updateButtonsState) Only 1 page, disable "next" & "previous" links`);

      disableButton(paginationPreviousPageButton, previousPageEventListener);
      disableButton(paginationNextPageButton, nextPageEventListener);
    } else {
      enableButton(paginationPreviousPageButton, previousPageEventListener);
      enableButton(paginationNextPageButton, nextPageEventListener);

      // First page
      if(page == 1) {
        Logger.log(`(PopupPagination.updateButtonsState) Page 1/${ pagesCount }, disable "previous" link`);
        disableButton(paginationPreviousPageButton, previousPageEventListener);
      }

      // Last page
      if(page == pagesCount) {
        Logger.log(`(PopupPagination.updateButtonsState) Page ${ page }/${ pagesCount }, disable "next" link`);
        disableButton(paginationNextPageButton, nextPageEventListener);
      }
    }
  }

  return {
    setupEventListeners: function() {
      Logger.log('(PopupPagination.setupEventListeners)');
      paginationPreviousPageButton.addEventListener( 'click', previousPageEventListener );
      paginationNextPageButton.addEventListener( 'click', nextPageEventListener );
      paginationPageSelector.addEventListener( 'change', changePageEventListener );
    },

    setPaginationVisibility: function() {
      Settings.init().then( function() {
        const perPage = Settings.get('perPage');
        if(!perPage) {
          paginationContainer.style.display = 'none';
        }
      });
    },

    updatePaginationUI: function(currentPage, perPage, itemsCount) {
      buildPageSelector(perPage, itemsCount);
      setCurrentPage(currentPage);
      updateButtonsState(currentPage, perPage, itemsCount);
    }
  };
})();

export default PopupPagination;
