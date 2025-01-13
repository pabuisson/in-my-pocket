import { VersionManager } from "../src/modules/version_manager"

describe("VersionManager.isMajorOrMinorUpdate", () => {
  beforeEach(() => {
    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1.2.2" })
  })

  test("returns false if version has not been updated", () => {
    const current = "1.2.2"
    const previous = "1.2.2"
    expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(false)
  })

  describe("comparing to newer versions", () => {
    test("returns false if version update is a fix (1.2.X)", () => {
      const current = "1.2.2"
      const previous = "1.2.1"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(false)
    })

    test("returns true if version update is minor (1.X.X)", () => {
      const current = "1.2.2"
      const previous = "1.1.0"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(true)
    })

    test("returns true if version update is major (X.X.X)", () => {
      const current = "1.2.2"
      const previous = "0.1.0"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(true)
    })
  })

  describe("comparing to older versions", () => {
    test("returns false if version is a previous fix (1.2.3)", () => {
      const current = "1.2.2"
      const previous = "1.2.3"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(false)
    })
    test("returns false if version is a previous minor (1.3.0)", () => {
      const current = "1.2.2"
      const previous = "1.3.0"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(false)
    })
    test("returns false if version is a previous major (2.X.X)", () => {
      const current = "1.2.2"
      const previous = "2.0.0"
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).toBe(false)
    })
  })
})

describe("VersionManager.mustTriggerFullResync", () => {
  describe("forceResyncVersion is defined", () => {
    beforeEach(() => {
      jest.spyOn(VersionManager, "forceResyncVersion").mockReturnValue("2.0.0")
    })

    test("returns false if last full sync is more recent than forceResyncVersion", () => {
      const lastFullSyncAtVersion = "2.2.2"
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(false)
    })

    test("returns false if last full sync is same as forceResyncVersion", () => {
      const lastFullSyncAtVersion = "2.0.0"
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(false)
    })

    test("returns false if lastFullSyncAtVersion does not exist (never synced completely)", () => {
      const lastFullSyncAtVersion = undefined
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(false)
    })

    test("returns true if last full sync is older than forceResyncVersion", () => {
      const lastFullSyncAtVersion = "1.0.0"
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(true)
    })
  })

  describe("forceResyncVersion is undefined", () => {
    beforeEach(() => {
      jest.spyOn(VersionManager, "forceResyncVersion").mockReturnValue(undefined)
    })

    test("returns false if lastFullSyncAtVersion does not exist", () => {
      const lastFullSyncAtVersion = undefined
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(false)
    })

    test("returns false if lastFullSyncAtVersion exists", () => {
      const lastFullSyncAtVersion = "1.0.0"
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).toBe(false)
    })
  })
})

describe("VersionManager.mustShowUpdateNotification", () => {
  test("returns false if installation details refer to an install", () => {
    const details = { reason: "install", previousVersion: undefined }
    expect(VersionManager.mustShowUpdateNotification(details)).toBe(false)
  })

  describe("installations details refer to an update", () => {
    beforeEach(() => {
      jest.spyOn(VersionManager, "getCurrentVersion").mockReturnValue("2.2.2")
    })

    test("returns false if same version", () => {
      const details = { reason: "update", previousVersion: "2.2.2" }
      expect(VersionManager.mustShowUpdateNotification(details)).toBe(false)
    })

    test("returns false if patch upgrade", () => {
      const details = { reason: "update", previousVersion: "2.2.1" }
      expect(VersionManager.mustShowUpdateNotification(details)).toBe(false)
    })

    test("returns true if minor upgrade", () => {
      const details = { reason: "update", previousVersion: "2.1.0" }
      expect(VersionManager.mustShowUpdateNotification(details)).toBe(true)
    })

    test("returns true if major upgrade", () => {
      const details = { reason: "update", previousVersion: "1.1.0" }
      expect(VersionManager.mustShowUpdateNotification(details)).toBe(true)
    })
  })
})
