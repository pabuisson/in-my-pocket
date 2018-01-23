"use strict";

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

const consumerKey = '58817-addc87503598b7ed29e5bf72';

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MouseButtons = {
  LEFT:   0,
  MIDDLE: 1,
  RIGHT:  2
};

export { PocketError, PocketNotice, MouseButtons, consumerKey };

