import { VersionManager, VERSION_LEVELS } from '../src/modules/version_manager.js';

describe('VersionManager.isUpdate', () => {
  beforeEach( () => {
    sinon.stub(browser.runtime, 'getManifest').returns({ version: '1.2.2' });
  });

  afterEach( () => {
    browser.runtime.getManifest.restore();
  });

  it('returns false if version has not been updated', () => {
    const previous = '1.2.2';
    expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(false);
  });

  describe('comparing to newer versions', () => {
    it('returns false if version update is a fix (1.2.X)', () => {
      const previous = '1.2.1';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(false);
    });

    it('returns true if version update is minor (1.X.X)', () => {
      const previous = '1.1.0';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(true);
    });

    it('returns true if version update is major (X.X.X)', () => {
      const previous = '0.1.0';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(true);
    });
  });

  describe('comparing to older versions', () => {
    it('returns false if version is a previous fix (1.2.3)', () => {
      const previous = '1.2.3';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(false);
    });
    it('returns false if version is a previous minor (1.3.0)', () => {
      const previous = '1.3.0';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(false);
    });
    it('returns false if version is a previous major (2.X.X)', () => {
      const previous = '2.0.0';
      expect(VersionManager.isUpdate(previous, VERSION_LEVELS.MINOR)).to.equal(false);
    });
  });
});
