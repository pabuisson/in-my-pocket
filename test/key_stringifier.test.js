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
  const key_a = 65;
  const key_2 = 50;
  const key_f4 = 115;

  it('return uppercase letter if letter', () => {
    const ev = { which: key_a, keyCode: key_a };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('A');
  });

  it('return digit if digit', () => {
    const ev = { which: key_2, keyCode: key_2 };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('2');
  });

  it('return uppercase fkey if fkey', () => {
    const ev = { which: key_f4, keyCode: key_f4, key: 'F4' };
    expect(KeyStringifier.stringifyKey(ev) ).to.equal('F4');
  });
});
