"use strict";

// -------------------------------------

const VERSION_LEVELS = {
  'MAJOR': 0,
  'MINOR': 1,
  'PATCH': 2
};

const VersionManager = (function() {
  const forceResyncVersion = undefined;

  // eslint-disable-next-line max-params
  function isGreater(newVersion, baseVersion, granularity = VERSION_LEVELS.PATCH, currentGranularity = VERSION_LEVELS.MAJOR) {
    newVersion = newVersion || VersionManager.getCurrentVersion();
    const newVersionPart = newVersion.split('.')[currentGranularity];
    const baseVersionPart = baseVersion.split('.')[currentGranularity];

    if(newVersionPart > baseVersionPart) {
      return true;
    } else if(newVersionPart < baseVersionPart) {
      return false;
    } else {
      if(currentGranularity < granularity && currentGranularity < VERSION_LEVELS.PATCH)
        return isGreater(newVersion, baseVersion, granularity, currentGranularity + 1);
      else
        return false;
    }
  }

  return {
    getCurrentVersion: function() {
      return browser.runtime.getManifest().version;
    },

    forceResyncVersion: function() {
      return forceResyncVersion;
    },

    isMajorOrMinorUpdate: function(newVersion, baseVersion) {
      return isGreater(newVersion, baseVersion, VERSION_LEVELS.MINOR);
    },

    mustShowUpdateNotification: function(details) {
      if (details.reason !== 'update') return false;

      const currentVersion = VersionManager.getCurrentVersion();
      const isMajorOrMinorUpdate = VersionManager.isMajorOrMinorUpdate(currentVersion, details.previousVersion);

      return isMajorOrMinorUpdate;
    },

    // Don't trigger resync if there's no forceResyncVersion defined
    // If defined, only trigger resync if last full resync is older
    mustTriggerFullResync: function(lastFullSyncAtVersion) {
      if (typeof VersionManager.forceResyncVersion() === undefined) return false;
      return isGreater(VersionManager.forceResyncVersion(), lastFullSyncAtVersion);
    }
  };
})();

export { VERSION_LEVELS, VersionManager };
