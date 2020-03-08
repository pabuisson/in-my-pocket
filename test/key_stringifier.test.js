import KeyStringifier from '../src/modules/key_stringifier.js';

describe('KeyStringifier.stringifyCtrlKey', () => {
  it('return empty string if ctrlKey not down', () => {
    const ev = { ctrlKey: false };
    expect(KeyStringifier.stringifyCtrlKey(ev) ).to.equal('');
  });

  describe('on a mac', () => {
    beforeEach( () => { global.window.navigator.platform = 'MacIntel'; });
    afterEach(  () => { global.window.navigator.platform = ''; });

    it('returns MacCtrl', () => {
      const ev = { ctrlKey: true };
      expect(KeyStringifier.stringifyCtrlKey(ev) ).to.equal('MacCtrl');
    });
  });

  it('returns Ctrl otherwise', () => {
    const ev = { ctrlKey: true };
    expect(KeyStringifier.stringifyCtrlKey(ev) ).to.equal('Ctrl');
  });
});


describe('KeyStringifier.stringifyKey', () => {
  const keycodes = {
    'a': 65,
    '2': 50,
    'f4': 115
  };

  it('return uppercase letter if letter', () => {
    const ev = { which: keycodes['a'], keyCode: keycodes['a'] };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('A');
  });

  it('return digit if digit', () => {
    const ev = { which: keycodes['2'], keyCode: keycodes['2'] };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('2');
  });

  it('return uppercase fkey if fkey', () => {
    const ev = { which: keycodes['f4'], keyCode: keycodes['f4'], key: 'F4' };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('F4');
  });
});
