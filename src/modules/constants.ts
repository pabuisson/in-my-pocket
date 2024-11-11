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

const parseIntBase = 10

const concealedProtocols = ["http", "https", "ftp", "ftps"]

const FavoriteFilterState = {
  ON: 0,
  OFF: 1,
  UNSET: 2,
}

export {
  FavoriteFilterState,
  MouseButtons,
  PocketApiStatus,
  PocketError,
  PocketNotice,
  concealedProtocols,
  consumerKey,
  parseIntBase,
}
