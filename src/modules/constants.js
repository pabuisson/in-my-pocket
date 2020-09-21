"use strict";

const consumerKey = '58817-addc87503598b7ed29e5bf72';

const PocketError = {
  GENERIC:      'generic',
  UNREACHABLE:  'unreachable',
  UNAUTHORIZED: 'unauthorized',
  PERMISSIONS:  'missing_permissions',
  RATE_LIMIT:   'user_rate_limit_reached'
};

const PocketApiStatus = {
  CREATED:  '0',
  ARCHIVED: '1',
  DELETED:  '2'
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

const parseIntBase = 10;

const concealedProtocols = ['http', 'https', 'ftp', 'ftps'];

const FavoriteFilterState = {
  ON: 0,
  OFF: 1,
  UNSET: 2
};

const TextSelectionState = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1
};


export {
  FavoriteFilterState,
  KeyboardShortcuts,
  MouseButtons,
  PocketApiStatus,
  PocketError,
  PocketNotice,
  TextSelectionState,
  concealedProtocols,
  consumerKey,
  parseIntBase,
};

