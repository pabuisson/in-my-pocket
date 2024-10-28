"use strict"

const consumerKey = "58817-addc87503598b7ed29e5bf72"

const PocketError = {
  UNAUTHORIZED: "unauthorized",
  RATE_LIMIT: "user_rate_limit_reached",
  PERMISSIONS: "missing_permissions",
  NOT_FOUND: "not_found",
  TIMEOUT: "timeout",
  UNKNOWN: "unknown",
  GENERIC: "generic",
}

const PocketApiStatus = {
  CREATED: "0",
  ARCHIVED: "1",
  DELETED: "2",
}

const PocketNotice = {
  ALREADY_IN_LIST: "already_in_list",
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MouseButtons = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
}

const KeyboardShortcuts = {
  toggle: "toggle-page-status",
  openPopup: "_execute_browser_action",
  openFirstItem: "open-first-item",
  openRandomItem: "open-random-item",
}

const parseIntBase = 10

const concealedProtocols = ["http", "https", "ftp", "ftps"]

const FavoriteFilterState = {
  ON: 0,
  OFF: 1,
  UNSET: 2,
}

const AutomationKind = {
  closeWhenAdded: "closeWhenAdded",
  closeWhenRead: "closeWhenRead",
}
const RemovalMethod = {
  archive: "archive",
  delete: "delete",
}

export {
  AutomationKind,
  FavoriteFilterState,
  KeyboardShortcuts,
  MouseButtons,
  PocketApiStatus,
  PocketError,
  PocketNotice,
  RemovalMethod,
  concealedProtocols,
  consumerKey,
  parseIntBase,
}
