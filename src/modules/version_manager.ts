"use strict"

const VERSION_LEVELS = {
  MAJOR: 0,
  MINOR: 1,
  PATCH: 2,
}

// TODO: define a new type for versions, instead of a bare "string"

const VersionManager = (function () {
  const forceResyncVersion = "0.12.0"

  // eslint-disable-next-line max-params
  function isGreater(
    newVersion: string,
    baseVersion: string,
    granularity = VERSION_LEVELS.PATCH,
    currentGranularity = VERSION_LEVELS.MAJOR,
  ): boolean {
    newVersion = newVersion || VersionManager.getCurrentVersion()
    const newVersionPart = newVersion.split(".")[currentGranularity]
    const baseVersionPart = baseVersion.split(".")[currentGranularity]

    if (newVersionPart > baseVersionPart) {
      return true
    } else if (newVersionPart < baseVersionPart) {
      return false
    } else {
      if (
        currentGranularity < granularity &&
        currentGranularity < VERSION_LEVELS.PATCH
      )
        return isGreater(
          newVersion,
          baseVersion,
          granularity,
          currentGranularity + 1,
        )
      else return false
    }
  }

  return {
    getCurrentVersion: function () {
      // @ts-ignore
      return browser.runtime.getManifest().version
    },

    forceResyncVersion: function () {
      return forceResyncVersion
    },

    isMajorOrMinorUpdate: function (
      newVersion: string,
      baseVersion: string,
    ): boolean {
      return isGreater(newVersion, baseVersion, VERSION_LEVELS.MINOR)
    },

    mustShowUpdateNotification: function (details: any) {
      if (details.reason !== "update") return false

      const currentVersion = VersionManager.getCurrentVersion()
      const isMajorOrMinorUpdate = VersionManager.isMajorOrMinorUpdate(
        currentVersion,
        details.previousVersion,
      )

      return isMajorOrMinorUpdate
    },

    mustTriggerFullResync: function (lastFullSyncAtVersion: string): boolean {
      if (!lastFullSyncAtVersion) return false
      if (!VersionManager.forceResyncVersion()) return false
      return isGreater(
        VersionManager.forceResyncVersion(),
        lastFullSyncAtVersion,
      )
    },
  }
})()

export { VERSION_LEVELS, VersionManager }
