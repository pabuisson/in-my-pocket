"use strict";

import './options.html';
import './options.scss';

import Authentication from '../modules/authentication.js';
import Badge          from '../modules/badge.js';
import ContextMenu    from '../modules/context_menu.js';
import Keyboard       from '../modules/keyboard.js';
import PageAction     from '../modules/page_action.js';
import Settings       from '../modules/settings.js';
import { KeyboardShortcuts, parseIntBase } from '../modules/constants.js';

// -------------

const disconnectRow                  = document.querySelector('.disconnect-row');
const disconnectStep2                = document.querySelector('.disconnect-second-step');
const disconnectActionStep1          = document.querySelector('.disconnect-first-step');
const disconnectActionStep2Confirm   = document.querySelector('.disconnect-second-step-confirm');
const disconnectActionStep2Cancel    = document.querySelector('.disconnect-second-step-cancel');
const displayBadgeCountCheckbox      = document.querySelector('.display-badge-count');
const displayPageActionCheckbox      = document.querySelector('.display-page-action');
const enableDebugModeCheckbox        = document.querySelector('.enable-debug-mode');
const enableBugReportCheckbox        = document.querySelector('.enable-bug-report');
const openInNewTabCheckbox           = document.querySelector('.open-in-new-tab');
const paginationPerPageSelector      = document.querySelector('.pagination-per-page');
const zoomLevelSelector              = document.querySelector('.zoom-level');
const archiveWhenOpenedCheckbox      = document.querySelector('.archive-when-opened');
const closeTabWhenAddedCheckbox      = document.querySelector('.close-tab-when-added');
const closeTabWhenReadCheckbox       = document.querySelector('.close-tab-when-read');
const keyboardOpenPopupShortcut      = document.querySelector('.keyboard-open-popup');
const keyboardToggleShortcut         = document.querySelector('.keyboard-toggle');
const keyboardOpenFirstItemShortcut  = document.querySelector('.keyboard-open-first-item');
const keyboardOpenRandomItemShortcut = document.querySelector('.keyboard-open-random-item');

const savedNotificationElement = document.querySelector('.saved-notification');


const UI = (function() {
  let savedNotificationTimerId = null;

  function flashSavedNotification(containerRow) {
    savedNotificationElement.classList.remove('hidden');

    if(containerRow) {
      const topMarginInPx = 2;
      const offsetTop = parseInt(containerRow.offsetTop, parseIntBase) + topMarginInPx;
      savedNotificationElement.style.top = `${offsetTop}px`;
    } else {
      savedNotificationElement.style.top = '0px';
    }

    if( savedNotificationTimerId ) {
      clearTimeout( savedNotificationTimerId );
    }

    savedNotificationTimerId = setTimeout( () => {
      savedNotificationElement.classList.add('hidden');
    }, 2000 );
  }

  function initializeUIFromSettings() {
    // If user is not connected, hide the "disconnect" link
    Authentication.isAuthenticated().catch( function() {
      disconnectRow.style.display = 'none';
    });

    // Initialize the state of all UI elements
    Settings.init().then(function() {
      const settings = Settings.get();

      displayBadgeCountCheckbox.checked    = settings['showBadge'];
      displayPageActionCheckbox.checked    = settings['showPageAction'];
      enableDebugModeCheckbox.checked      = settings['debugMode'];
      enableBugReportCheckbox.checked      = settings['bugReport'];
      openInNewTabCheckbox.checked         = settings['openInNewTab'];
      archiveWhenOpenedCheckbox.checked    = settings['archiveWhenOpened'];
      closeTabWhenAddedCheckbox.checked    = settings['closeTabWhenAdded'];
      closeTabWhenReadCheckbox.checked     = settings['closeTabWhenRead'];
      paginationPerPageSelector.value      = settings['perPage'] || '';
      zoomLevelSelector.value              = settings['zoomLevel'];

      keyboardOpenPopupShortcut.value      = settings['keyboardOpenPopup'];
      keyboardToggleShortcut.value         = settings['keyboardToggle'];
      keyboardOpenFirstItemShortcut.value  = settings['keyboardOpenFirstItem'];
      keyboardOpenRandomItemShortcut.value = settings['keyboardOpenRandomItem'];
    });
  }

  return {
    setup: function() {
      initializeUIFromSettings();

      // Event: "Display count badge" checkbox
      displayBadgeCountCheckbox.addEventListener('change', function() {
        Settings.set('showBadge', this.checked);
        Settings.save();
        Badge.updateCount();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Display add-to-pocket icon in address bar" checkbox
      displayPageActionCheckbox.addEventListener('change', function() {
        Settings.set('showPageAction', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);

        if(this.checked) {
          PageAction.redrawAllTabs();
        } else {
          PageAction.hideAllTabs();
        }
      });

      // Event: "Open in new tab" checkbox
      openInNewTabCheckbox.addEventListener('change', function() {
        Settings.set('openInNewTab', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Enable debug mode" checkbox
      enableDebugModeCheckbox.addEventListener('change', function() {
        Settings.set('debugMode', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Enable bug reoprt" checkbox
      enableBugReportCheckbox.addEventListener('change', function() {
        Settings.set('bugReport', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Automation: archive when opened" checkbox
      archiveWhenOpenedCheckbox.addEventListener('change', function() {
        Settings.set('archiveWhenOpened', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Automation: close tab when added" checkbox
      closeTabWhenAddedCheckbox.addEventListener('change', function() {
        Settings.set('closeTabWhenAdded', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      // Event: "Automation: close tab when read" checkbox
      closeTabWhenReadCheckbox.addEventListener('change', function() {
        Settings.set('closeTabWhenRead', this.checked);
        Settings.save();
        flashSavedNotification(this.parentNode);
      } );

      paginationPerPageSelector.addEventListener('change', function() {
        Settings.set('perPage', parseInt(this.value, parseIntBase) || null);
        Settings.save();

        // Reset the display options (no need to read it from local storage
        // since we just reset it)
        const displayOptions = { currentPage: 1, displayedAt: null };
        browser.storage.local.set({ display: JSON.stringify(displayOptions) });

        flashSavedNotification(this.parentNode);
      });

      // Event: "Zoom level" selector
      zoomLevelSelector.addEventListener('change', function() {
        Settings.set('zoomLevel', this.value);
        Settings.save();
        flashSavedNotification(this.parentNode);
      });

      //
      // Only register keyboard update events if browser is able to to upgrade keyboard shortcuts
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands/update
      //
      if(browser.commands.update) {
        // Event: updating "toggle page state" keyboard shortcut
        keyboardToggleShortcut.addEventListener('keydown', function(ev) {
          ev.preventDefault();
          this.value = Keyboard.stringifyCombination(ev);

          if(Keyboard.isValidCombination(ev)) {
            Settings.set('keyboardToggle', this.value);
            Settings.save();
            Keyboard.registerShortcut(KeyboardShortcuts.toggle, this.value);
            flashSavedNotification(this.parentNode);
            this.blur();
          }
        });

        // Event: updating "open popup" keyboard shortcut
        keyboardOpenPopupShortcut.addEventListener('keydown', function(ev) {
          ev.preventDefault();
          this.value = Keyboard.stringifyCombination(ev);

          if(Keyboard.isValidCombination(ev)) {
            Settings.set('keyboardOpenPopup', this.value);
            Settings.save();
            Keyboard.registerShortcut(KeyboardShortcuts.openPopup, this.value);
            flashSavedNotification(this.parentNode);
            this.blur();
          }
        });

        // Event: updating "open first item" keyboard shortcut
        keyboardOpenFirstItemShortcut.addEventListener('keydown', function(ev) {
          ev.preventDefault();
          this.value = Keyboard.stringifyCombination(ev);

          if(Keyboard.isValidCombination(ev)) {
            Settings.set('keyboardOpenFirstItem', this.value);
            Settings.save();
            Keyboard.registerShortcut(KeyboardShortcuts.openFirstItem, this.value);
            flashSavedNotification(this.parentNode);
            this.blur();
          }
        });

        // Event: updating "open random item" keyboard shortcut
        keyboardOpenRandomItemShortcut.addEventListener('keydown', function(ev) {
          ev.preventDefault();
          this.value = Keyboard.stringifyCombination(ev);

          if(Keyboard.isValidCombination(ev)) {
            Settings.set('keyboardOpenRandomItem', this.value);
            Settings.save();
            Keyboard.registerShortcut(KeyboardShortcuts.openRandomItem, this.value);
            flashSavedNotification(this.parentNode);
            this.blur();
          }
        });
      } else {
        keyboardToggleShortcut.setAttribute('disabled', 'disabled');
        keyboardOpenPopupShortcut.setAttribute('disabled', 'disabled');
        keyboardOpenFirstItemShortcut.setAttribute('disabled', 'disabled');
        keyboardOpenRandomItemShortcut.setAttribute('disabled', 'disabled');
      }

      // Event : "Disconnect" from the Pocket account click
      disconnectActionStep1.addEventListener( 'click', function(ev) {
        ev.preventDefault();
        disconnectStep2.classList.remove('hidden');
      });

      disconnectActionStep2Cancel.addEventListener('click', function(ev) {
        ev.preventDefault();
        disconnectStep2.classList.add('hidden');
      });

      disconnectActionStep2Confirm.addEventListener('click', function(ev) {
        ev.preventDefault();
        browser.storage.local.get().then( data => {
          const keysToPersist = ['settings'];
          const keysToRemove = Object.keys(data).filter( key => {
            // Filter out keys listed in keysToPersist, and keeps
            // all the other storage keys -> those will be removed
            return keysToPersist.indexOf(key) < 0;
          });

          browser.storage.local.remove(keysToRemove);

          // Remove the badge, destroy all right-click entries, and hides pageActions
          Badge.hide();
          ContextMenu.destroyEntries();
          PageAction.hideAllTabs();

          disconnectRow.classList.add('hidden');
        });
      });
    }
  };
})();


// ---------------------------------------


document.addEventListener('DOMContentLoaded', function() {
  UI.setup();
});
