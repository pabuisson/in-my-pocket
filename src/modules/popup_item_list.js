"use strict";

import Logger  from '../modules/logger.js';
import PopupUI from '../modules/popup_ui.js';
import Utility from '../modules/utility.js';
import { MouseButtons } from '../modules/constants.js';

// ----------------

const PopupItemList = ( function() {
  const ITEMS_PER_BATCH = 50;
  let itemsToCreate     = undefined;
  let totalItemsCount   = undefined;
  let createdItemsCount = undefined;
  const itemsContainer  = document.querySelector('.list-component');

  function areAllItemsBuilt() {
    const isInitialized    = totalItemsCount !== undefined && createdItemsCount !== undefined;
    const areAllItemsBuilt = createdItemsCount === totalItemsCount;

    return isInitialized && areAllItemsBuilt;
  }

  function faviconUrl( url ) {
    return "http://www.google.com/s2/favicons?domain_url=" + encodeURIComponent(url);
  }

  function formatUrl( url ) {
    const protocolsToRemove = [
      'http', 'https',
      'ftp',  'ftps'
    ].join('|');
    const removalRegex = new RegExp('(' + protocolsToRemove + ')://(www.){0,1}', 'gi');

    return url.replace(removalRegex, '');
  }

  function formatTitle(title) {
    return title || " — ";
  }

  // openInNewTab param allows us to force the behaviour (ctrl-click or middle-click)
  function openLink( itemId, openInNewTab = false ) {
    browser.runtime.sendMessage({
      action: 'read-item',
      itemId: itemId,
      openInNewTab: openInNewTab
    });
  }

  function resetUI() {
    itemsContainer.innerHTML = '';
  }

  function buildItemElement(item) {
    const liElement        = document.createElement('li');
    const faviconElement   = document.createElement('img');
    const titleContent     = document.createElement('span');
    const urlContent       = document.createElement('span');

    const actionContainer  = document.createElement('div');

    const favoriteAction      = document.createElement('div');
    const favoriteElement     = document.createElement('div');
    const favoriteIconFont    = document.createElement('i');
    const favoriteLoadElement = document.createElement('div');

    const tickAction       = document.createElement('div');
    const tickElement      = document.createElement('div');
    const tickIconFont     = document.createElement('i');
    const tickLoadElement  = document.createElement('div');

    const deleteAction     = document.createElement('div');
    const trashElement     = document.createElement('div');
    const trashIconFont    = document.createElement('i');
    const trashLoadElement = document.createElement('div');

    liElement.className = 'item';
    if(item.fav == 1) {
      liElement.classList.add('favorite');
    }

    faviconElement.className = 'favicon';
    titleContent.className   = 'title';
    urlContent.className     = 'url';

    actionContainer.className = 'actions-container';

    favoriteAction.className = 'favorite-action';
    favoriteIconFont.classList.add('icon', 'ion-star');
    favoriteElement.className  = 'favorite';
    favoriteLoadElement.classList.add('loader', 'hidden');

    tickAction.className = 'tick-action';
    tickIconFont.classList.add('icon', 'ion-checkmark');
    tickElement.className  = 'tick';
    tickLoadElement.classList.add('loader', 'hidden');

    deleteAction.className = 'delete-action';
    trashIconFont.classList.add('icon', 'ion-trash-b');
    trashElement.className = 'trash';
    trashLoadElement.classList.add('loader', 'hidden');

    faviconElement.setAttribute('src', faviconUrl(item.resolved_url));

    titleContent.appendChild(faviconElement);
    titleContent.appendChild(document.createTextNode( formatTitle(item.resolved_title) ));

    urlContent.appendChild(document.createTextNode( formatUrl(item.resolved_url) ));

    favoriteElement.appendChild(favoriteIconFont);
    favoriteAction.appendChild(favoriteElement);
    favoriteAction.appendChild(favoriteLoadElement);

    tickElement.appendChild(tickIconFont);
    tickAction.appendChild(tickElement);
    tickAction.appendChild(tickLoadElement);

    trashElement.appendChild(trashIconFont);
    deleteAction.appendChild(trashElement);
    deleteAction.appendChild(trashLoadElement);

    actionContainer.appendChild(favoriteAction);
    actionContainer.appendChild(tickAction);
    actionContainer.appendChild(deleteAction);

    liElement.appendChild(actionContainer);
    liElement.appendChild(titleContent);
    liElement.appendChild(document.createElement('br'));
    liElement.appendChild(urlContent);

    liElement.dataset.id  = item.id;
    liElement.dataset.fav = item.fav;

    return liElement;
  }

  function buildDomFragment(items) {
    const fragment = document.createDocumentFragment();
    for(let i = 0; i < items.length; i++) {
      const newDomElement = buildItemElement(items[i]);
      fragment.appendChild(newDomElement);
    }

    return fragment;
  }

  function buildBatch() {
    Logger.log(`(PopupItemList.buildBatch) build a new batch of ${ITEMS_PER_BATCH} items`);

    for(let i = 0; i < ITEMS_PER_BATCH; i++) {
      // If we've already built all items then get out of this loop
      if(areAllItemsBuilt() == true) {
        Logger.log('All items are built -> break out of this loop, now!');
        break;
      }

      const itemToCreate = itemsToCreate[createdItemsCount];
      itemsContainer.appendChild( buildItemElement(itemToCreate) );

      createdItemsCount++;
    }

    // if DOM is not all built yet, then ask for another animation frame where
    // we can keep on building the DOM
    if(areAllItemsBuilt() == false) {
      Logger.log('Will request an animation frame for another run of the buildBatch method');
      requestAnimationFrame(buildBatch);
    }
  }

  return {
    setupEventListeners: function() {
      itemsContainer.addEventListener('mouseup', function(ev) {
        if(!ev.target)
          return;

        ev.preventDefault();

        const targetItem = Utility.getParent(ev.target, '.item');
        const targetItemId = targetItem.dataset.id;

        if(Utility.matchesOrHasParent(ev.target, '.delete-action')) {
          Logger.log(`(PopupItemList.eventListener) Clicked .delete-action for item ${targetItemId}`);
          PopupUI.deleteItem(targetItemId);
        } else if(Utility.matchesOrHasParent(ev.target, '.tick-action')) {
          Logger.log(`(PopupItemList.eventListener) Clicked .tick-action for item ${targetItemId}`);
          PopupUI.markAsRead(targetItemId);
        } else if(Utility.matchesOrHasParent(ev.target, '.favorite-action')) {
          Logger.log(`(PopupItemList.eventListener) Clicked .favorite-action for item ${targetItemId}`);
          PopupUI.toggleFavorite(targetItemId);
        } else if(ev.target.matches('.title') || ev.target.matches('.url')) {
          const openInNewTab = true;
          switch(ev.button) {
            case MouseButtons.MIDDLE:
              Logger.log(`(PopupItemList.eventListener) Middle-click, force opening ${targetItemId} in new tab`);
              openLink(targetItemId, openInNewTab);
              break;
            case MouseButtons.LEFT:
              if(ev.ctrlKey || ev.metaKey) {
                Logger.log(`(PopupItemList.eventListener) left-click + ctrlKey:${ev.ctrlKey}/metaKey:${ev.metaKey}, force opening ${targetItemId} in new tab`);
                openLink(targetItemId, openInNewTab);
              } else {
                Logger.log(`(PopupItemList.eventListener) left-click, open ${targetItemId} based on openInNewTab setting`);
                openLink(targetItemId);
              }
              break;
          }
        }
      });
    },

    buildAll: function( items ) {
      Logger.log('(PopupItemList.buildAll)');

      // Remove previous "requestAnimationFrame" registered in case
      cancelAnimationFrame( buildBatch );

      // Reset list component content
      resetUI();

      // Prepare dom building
      itemsToCreate     = items;
      totalItemsCount   = items.length;
      createdItemsCount = 0;

      // Build the dom
      Logger.log('(PopupItemList.buildAll) Request a 1st animation frame for buildBatch method');
      requestAnimationFrame( buildBatch );
    },

    // Will build DOM for items and insert it before the item whose id=beforeItemId
    insertItems: function(items, beforeItemId) {
      const beforeNode = document.querySelector(`.item:not(.disappearing)[data-id='${beforeItemId}']`);
      Logger.log(`(PopupItemList.insertItems) Insert ${items.length} items before item ${beforeItemId}`);
      Logger.log(`(PopupItemList.insertItems) Insert before ${beforeNode}`);
      const domToInsert = buildDomFragment(items);
      itemsContainer.insertBefore(domToInsert, beforeNode);
    },

    // Will build DOM for items and insert it at the end of the list container
    appendItems: function(items) {
      const domToAppend = buildDomFragment(items);
      itemsContainer.appendChild(domToAppend);
    },

    getVisibleItemsIds: function() {
      const visibleItems = itemsContainer.querySelectorAll('.item:not(.disappearing)');
      const visibleItemsIds = [];

      Logger.log(`(PopupItemList.getVisibleItems) ${ visibleItems.length } visible items`);

      for( let i = 0; i < visibleItems.length; i++ ) {
        visibleItemsIds.push( visibleItems[ i ].dataset.id );
      }

      return visibleItemsIds;
    }
  };
})();

export default PopupItemList;
