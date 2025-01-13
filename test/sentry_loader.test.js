import SentryLoader from "../src/modules/sentry_loader.js"
import { VersionManager } from "../src/modules/version_manager"

describe("SentryLoader.init", () => {
  describe("uuid generation", () => {
    beforeEach(() => {
      jest.spyOn(self.crypto, "randomUUID").mockReturnValue("1234")
      jest.spyOn(VersionManager, "getCurrentVersion").mockReturnValue("1.0.0")
    })

    test("generates and stores a uuid the first time it is called", async () => {
      const setSpy = jest.spyOn(global.browser.storage.local, "set")

      // First time it is called, the uuid is not stored yet
      jest.spyOn(global.browser.storage.local, "get").mockResolvedValueOnce({ uuid: null })

      await SentryLoader.init()

      expect(setSpy).toHaveBeenCalledWith({ uuid: "1234" })
    })

    test("reuses the existing stored uuid the following times it is called", async () => {
      const setSpy = jest.spyOn(global.browser.storage.local, "set")

      // The UUID has already been generated and stored in the extension storage
      jest.spyOn(global.browser.storage.local, "get").mockResolvedValue({ uuid: "1234" })

      await SentryLoader.init()

      expect(setSpy).not.toHaveBeenCalled()
    })
  })
})
