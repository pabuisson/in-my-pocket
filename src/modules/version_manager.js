"use strict";

// -------------------------------------

const VERSION_LEVELS = {
  'MAJOR': 0,
  'MINOR': 1,
  'PATCH': 2
};

const VersionManager = (function() {
  return {
    isUpdate: function(baseVersion, granularity, currentGranularity = VERSION_LEVELS.MAJOR) {
      const currentVersion = browser.runtime.getManifest().version;
      const currentLevel = currentVersion.split('.')[currentGranularity];
      const baseLevel = baseVersion.split('.')[currentGranularity];

      if(currentLevel > baseLevel) {
        return true;
      } else if(currentLevel < baseLevel) {
        return false;
      } else {
        if(currentGranularity < granularity && currentGranularity < VERSION_LEVELS.PATCH)
          return VersionManager.isUpdate(baseVersion, granularity, currentGranularity + 1);
        else
          return false;
      }
    },
  };
})();

export { VERSION_LEVELS, VersionManager };
