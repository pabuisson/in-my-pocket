import Utility from '../src/modules/utility.js';

describe('Utility.parseJson', () => {
  it('returns falsy value if can not parse', () => {
    expect( Utility.parseJson({}) ).to.equal( undefined );
  });

  describe('if json is parsable', () => {
    it('returns an object', () => {
      let jsonString = JSON.stringify({ a: 14 });
      expect( Utility.parseJson( jsonString ) ).to.be.a('Object');
    });

    it('returns an object with the expected properties', () => {
      let jsonString = JSON.stringify({ a: 14 });
      expect( Utility.parseJson( jsonString ) ).to.have.property('a', 14);
    });
  });
});
