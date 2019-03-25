"use strict";

import'./popup.html';
import'./popup.scss';

import Authentication from '../modules/authentication.js';
import Badge from '../modules/badge.js';
import Logger from '../modules/logger.js';
import PopupMainLoader from '../modules/popup_main_loader.js';
import PopupUI from '../modules/popup_ui.js';
import { PocketError, PocketNotice, MouseButtons } from '../modules/constants.js';


// --- EVENTS ---

// prevent general.autoScroll
document.body.onmousedown = ( e ) => {
  if (e.button === MouseButtons.MIDDLE )
    return false;
};


// - - - MAIN LOGIC LOOP - - -

document.addEventListener('DOMContentLoaded', function() {
  // Setup the UI and draw the list with items already in memory
  PopupUI.setup();

  Authentication.isAuthenticated().then( () => {
    PopupUI.drawList();
    // Enable the loading animation and try to update the list of items
    setTimeout( () => {
      PopupMainLoader.enable();
      browser.runtime.sendMessage({ action: 'retrieve-items', force: false });
    }, 1000);
  });

  // Listen for message from background
  browser.runtime.onMessage.addListener( function(eventData) {
    PopupMainLoader.disable();

    if(eventData.error || eventData.notice) {
      Logger.warn('(popup onMessage) : ' + eventData);

      const flashContainer = document.querySelector('.flash-overlay');
      const errorClass     = 'error';
      const noticeClass    = 'notice';
      let flashMessage = '';

      flashContainer.classList.remove(errorClass);
      flashContainer.classList.remove(noticeClass);

      if(eventData.error) {
        flashContainer.classList.add(errorClass);
        flashMessage = 'An error occurred: ';

        switch(eventData.error) {
          case PocketError.UNREACHABLE:
            flashMessage += 'could not reach the server';
            break;
          case PocketError.UNAUTHORIZED:
            flashMessage += 'unauthorized, you might need to login again';
            break;
          case PocketError.PERMISSIONS:
            flashMessage += 'missing permissions';
            break;
          case PocketError.RATE_LIMIT:
            flashMessage += 'max requests reached for this hour';
            flashMessage += ' (reset in ' + eventData.resetDelay + ')';
            break;
        }

        // Flash the badge if an error occured
        browser.runtime.sendMessage({ action: 'flash-error' });

      } else if(eventData.notice) {
        flashContainer.classList.add(noticeClass);

        switch(eventData.notice) {
          case PocketNotice.ALREADY_IN_LIST:
            flashMessage = 'This page is already in your Pocket :)';
            break;
        }
      }

      flashContainer.innerHTML = flashMessage;
      flashContainer.classList.remove('hidden');

      // Hide the error message after 5 seconds and reset the class list
      setTimeout( () => {
        flashContainer.classList.add('hidden');
      }, 5000 );

    } else {
      Logger.log('(popup onMessage) : ' + eventData.action);

      switch(eventData.action) {
        case 'authenticated':
          window.close();
          browser.runtime.sendMessage({ action: 'update-badge-count' });
          break;

        case 'marked-as-read':
        case 'deleted':
          PopupUI.fadeOutItem(eventData.id);
          PopupUI.updateList();
          break;

        case 'added-item':
          PopupUI.updateList();
          break;

        case 'retrieved-items':
          PopupUI.updateList();
          Badge.updateCount();
          break;
      }
    }
  });
});
