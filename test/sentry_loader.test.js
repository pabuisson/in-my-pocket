import SentryLoader from "../src/modules/sentry_loader.js"
import {VersionManager} from "../src/modules/version_manager.js"
import * as Sentry from "@sentry/browser"

describe("SentryLoader.init", () => {
  describe("uuid generation", () => {
    beforeEach(() => {
      sinon.stub(self.crypto, 'randomUUID').returns('1234')
      sinon.stub(Sentry, 'init')
      sinon.stub(VersionManager, 'getCurrentVersion').returns('1.0.0')
    })

    afterEach(() => {
      global.browser.storage.local.set.restore()
      global.browser.storage.local.get.restore()
      VersionManager.getCurrentVersion.restore()
      Sentry.init.restore()
      self.crypto.randomUUID.restore()
    })

    it("generates and stores a uuid the first time it is called", async () => {
      const setSpy = sinon.spy(global.browser.storage.local, 'set')
      const getStub = sinon.stub(global.browser.storage.local, 'get')

      // First time it is called, the uuid is not stored yet
      getStub.withArgs('uuid').resolves({ uuid: null })

      await SentryLoader.init()

      sinon.assert.calledWith(setSpy, { uuid: "1234" })
    })

    it("reuses the existing stored uuid the following times it is called", async () => {
      const setSpy = sinon.spy(global.browser.storage.local, 'set')
      const getStub = sinon.stub(global.browser.storage.local, 'get')

      // The UUID has already been generated and stored in the extension storage
      getStub.withArgs('uuid').resolves({ uuid: '1234' })

      await SentryLoader.init()

      sinon.assert.notCalled(setSpy)
    })
  })
})
