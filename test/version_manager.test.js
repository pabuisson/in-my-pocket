import { VersionManager } from '../src/modules/version_manager.js';

describe('VersionManager.isMajorOrMinorUpdate', () => {
  beforeEach( () => {
    sinon.stub(browser.runtime, 'getManifest').returns({ version: '1.2.2' });
  });

  afterEach( () => {
    browser.runtime.getManifest.restore();
  });

  it('returns false if version has not been updated', () => {
    const current = '1.2.2';
    const previous = '1.2.2';
    expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(false);
  });

  describe('comparing to newer versions', () => {
    it('returns false if version update is a fix (1.2.X)', () => {
      const current = '1.2.2';
      const previous = '1.2.1';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(false);
    });

    it('returns true if version update is minor (1.X.X)', () => {
      const current = '1.2.2';
      const previous = '1.1.0';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(true);
    });

    it('returns true if version update is major (X.X.X)', () => {
      const current = '1.2.2';
      const previous = '0.1.0';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(true);
    });
  });

  describe('comparing to older versions', () => {
    it('returns false if version is a previous fix (1.2.3)', () => {
      const current = '1.2.2';
      const previous = '1.2.3';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(false);
    });
    it('returns false if version is a previous minor (1.3.0)', () => {
      const current = '1.2.2';
      const previous = '1.3.0';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(false);
    });
    it('returns false if version is a previous major (2.X.X)', () => {
      const current = '1.2.2';
      const previous = '2.0.0';
      expect(VersionManager.isMajorOrMinorUpdate(current, previous)).to.equal(false);
    });
  });
});

describe('VersionManager.mustTriggerFullResync', () => {
  describe('forceResyncVersion is defined', () => {
    beforeEach( () => { sinon.stub(VersionManager, 'forceResyncVersion').returns('2.0.0'); });
    afterEach( () => { VersionManager.forceResyncVersion.restore(); });

    it('returns false if last full sync is more recent than forceResyncVersion', () => {
      const lastFullSyncAtVersion = '2.2.2';
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.false;
    });

    it('returns false if last full sync is same as forceResyncVersion', () => {
      const lastFullSyncAtVersion = '2.0.0';
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.false;
    });

    it('returns true if last full sync is older than forceResyncVersion', () => {
      const lastFullSyncAtVersion = '1.0.0';
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.true;
    });

    it('returns true if lastFullSyncAtVersion does not exist', () => {
      const lastFullSyncAtVersion = undefined;
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.true;
    });
  });

  describe('forceResyncVersion is undefined', () => {
    beforeEach( () => { sinon.stub(VersionManager, 'forceResyncVersion').returns(undefined); });
    afterEach( () => { VersionManager.forceResyncVersion.restore(); });

    it('returns false if lastFullSyncAtVersion does not exist', () => {
      const lastFullSyncAtVersion = undefined;
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.false;
    });

    it('returns false if lastFullSyncAtVersion exists', () => {
      const lastFullSyncAtVersion = '1.0.0';
      expect(VersionManager.mustTriggerFullResync(lastFullSyncAtVersion)).to.be.false;
    });
  });
});


describe('VersionManager.mustShowUpdateNotification', () => {
  it('returns false if installation details refer to an install', () => {
    const details = { reason: 'install', previousVersion: undefined };
    expect(VersionManager.mustShowUpdateNotification(details)).to.be.false;
  });

  describe('installations details refer to an update', () => {
    beforeEach( () => { sinon.stub(VersionManager, 'getCurrentVersion').returns('2.2.2'); });
    afterEach( () => { VersionManager.getCurrentVersion.restore(); });

    it('returns false if same version', () => {
      const details = { reason: 'update', previousVersion: '2.2.2' };
      expect(VersionManager.mustShowUpdateNotification(details)).to.be.false;
    });

    it('returns false if patch upgrade', () => {
      const details = { reason: 'update', previousVersion: '2.2.1' };
      expect(VersionManager.mustShowUpdateNotification(details)).to.be.false;
    });

    it('returns true if minor upgrade', () => {
      const details = { reason: 'update', previousVersion: '2.1.0' };
      expect(VersionManager.mustShowUpdateNotification(details)).to.be.true;
    });

    it('returns true if major upgrade', () => {
      const details = { reason: 'update', previousVersion: '1.1.0' };
      expect(VersionManager.mustShowUpdateNotification(details)).to.be.true;
    });
  });
});
