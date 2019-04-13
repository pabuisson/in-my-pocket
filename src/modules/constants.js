"use strict";

const consumerKey = '58817-addc87503598b7ed29e5bf72';

const PocketError = {
  GENERIC:      'generic',
  UNREACHABLE:  'unreachable',
  UNAUTHORIZED: 'unauthorized',
  PERMISSIONS:  'missing_permissions',
  RATE_LIMIT:   'user_rate_limit_reached'
};

const PocketNotice = {
  ALREADY_IN_LIST: 'already_in_list'
};

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MouseButtons = {
  LEFT:   0,
  MIDDLE: 1,
  RIGHT:  2
};

const KeyboardShortcuts = {
  toggle: 'toggle-page-status',
  openPopup: '_execute_browser_action',
  openFirstItem: 'open-first-item',
  openRandomItem: 'open-random-item'
};

export { KeyboardShortcuts, PocketError, PocketNotice, MouseButtons, consumerKey };

