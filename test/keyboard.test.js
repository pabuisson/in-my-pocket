import Keyboard from '../src/modules/keyboard.js';

const key_a = 65;
const key_2 = 50;
const key_f4 = 115;

describe('Keyboard.stringifyCombination', () => {
  describe('main modifiers', () => {
    it('Alt+something contains Alt', () => {
      const ev = { altKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('Alt');
    });

    it('Ctrl+something contains Ctrl', () => {
      const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('Ctrl');
    });
  });

  describe('optional modifier', () => {
    it('Alt+Shift+something contains Shift', () => {
      const ev = { altKey: true, shiftKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('Shift');
    });

    it('Ctrl+Shift+something contains Shift', () => {
      const ev = { ctrlKey: true, shiftKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('Shift');
    });
  });

  describe('on a mac', () => {
    beforeEach( () => { global.window.navigator.platform = 'MacIntel'; });
    afterEach(  () => { global.window.navigator.platform = ''; });

    it('Ctrl+something on a Mac contains MacCtrl', () => {
      const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('MacCtrl');
    });

    it('Ctrl+Shift+something on a Mac contains Shift', () => {
      const ev = { altKey: true, shiftKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('Shift');
    });
  });

  describe('main key', () => {
    it('Ctrl+letter contains the uppercase letter', () => {
      const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
      expect( Keyboard.stringifyCombination(ev) ).to.include('+A');
    });

    it('Ctrl+digit contains the digit', () => {
      const ev = { ctrlKey: true, which: key_2, keyCode: key_2 };
      expect( Keyboard.stringifyCombination(ev) ).to.include('+2');
    });

    it('Ctrl+fkey contains the uppercase fkey', () => {
      const ev = { ctrlKey: true, which: key_f4, keyCode: key_f4, key: 'F4' };
      expect( Keyboard.stringifyCombination(ev) ).to.include('+F4');
    });
  });

});


describe('Keyboard.isValidCombination', () => {
  describe('valid combinations', () => {
    describe('Alt something', () => {
      it('Alt+letter', () => {
        const ev = { altKey: true, shiftKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Alt+number', () => {
        const ev = { altKey: true, shiftKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Alt+f-key', () => {
        const ev = { altKey: true, shiftKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Alt+Shift+letter', () => {
        const ev = { altKey: true, shiftKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Alt+Shift+number', () => {
        const ev = { altKey: true, shiftKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Alt+Shift+f-key', () => {
        const ev = { altKey: true, shiftKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });
    });

    describe('ctr something', () => {
      it('Ctrl+letter', () => {
        const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Ctrl+number', () => {
        const ev = { ctrlKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Ctrl+f-key', () => {
        const ev = { ctrlKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Ctrl+Shift+letter', () => {
        const ev = { ctrlKey: true, shiftKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Ctrl+Shift+number', () => {
        const ev = { ctrlKey: true, shiftKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('Ctrl+Shift+f-key', () => {
        const ev = { ctrlKey: true, shiftKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });
    });

    describe('on a mac', () => {
      beforeEach( () => { global.window.navigator.platform = 'MacIntel'; });
      afterEach(  () => { global.window.navigator.platform = ''; });

      it('MacCtrl+letter', () => {
        const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('MacCtrl+number', () => {
        const ev = { ctrlKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('MacCtrl+f-key', () => {
        const ev = { ctrlKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('MacCtrl+Shift+letter', () => {
        const ev = { ctrlKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('MacCtrl+Shift+number', () => {
        const ev = { ctrlKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });

      it('MacCtrl+Shift+f-key', () => {
        const ev = { ctrlKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.true;
      });
    });
  });

  describe('invalid combinations', () => {
    describe('invalid modifier: meta', () => {
      it('Meta+letter', () => {
        const ev = { metaKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });

      it('Meta+number', () => {
        const ev = { metaKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });

      it('Meta+f-key', () => {
        const ev = { metaKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });
    });

    describe('invalid combination: two modifiers', () => {
      it('Alt+Ctrl+letter', () => {
        const ev = { altKey: true, ctrlKey: true, which: key_a, keyCode: key_a };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });

      it('Alt+Ctrl+number', () => {
        const ev = { altKey: true, ctrlKey: true, which: key_2, keyCode: key_2 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });

      it('Alt+Ctrl+letter', () => {
        const ev = { altKey: true, ctrlKey: true, which: key_f4, keyCode: key_f4 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });
    });

    describe('invalid key: special char', () => {
      it('Alt+$', () => {
        const ev = { altKey: true, ctrlKey: true, which: 164, keyCode: 164 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });

      it('Ctrl+$', () => {
        const ev = { altKey: true, ctrlKey: true, which: 164, keyCode: 164 };
        expect( Keyboard.isValidCombination(ev) ).to.be.false;
      });
    });
  });
});
