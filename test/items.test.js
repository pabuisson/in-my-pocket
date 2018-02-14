import Items from '../src/modules/items.js';

describe( 'Items.filter', () => {
  const matchingItem = { resolved_title: 'french', resolved_url: 'www.quelquepart.fr' };
  const otherItem = { resolved_title: 'other', resolved_url: 'www.somewherelse.com' };
  const items = [ matchingItem, otherItem ];

  it( 'returns all items if query is empty', () => {
    expect( Items.filter( items, '' ).length ).to.equal( items.length );
  });

  it( 'returns all items if query is undefined', () => {
    expect( Items.filter( items, undefined ).length ).to.equal( items.length );
  });

  it( 'returns all items if query is null', () => {
    expect( Items.filter( items, null ).length ).to.equal( items.length );
  });

  context( 'query on title', () => {
    context( 'with same case', () => {
      it( 'returns matching items', () => {
        const query = matchingItem.resolved_title;
        expect( Items.filter( items, query ) ).to.include( matchingItem );
      });

      it( 'filters out non-matching items', () => {
        const query = matchingItem.resolved_title;
        expect( Items.filter( items, query ) ).not.to.include( otherItem );
      });
    });

    context( 'with different case', () => {
      it( 'returns matching items', () => {
        const query = matchingItem.resolved_title.toUpperCase();
        expect( Items.filter( items, query ) ).to.include( matchingItem );
      });

      it( 'does not return non-matching items', () => {
        const query = matchingItem.resolved_title;
        expect( Items.filter( items, query ) ).not.to.include( otherItem );
      });
    });
  });


  context( 'query on url', () => {
    context( 'with same case', () => {
      it( 'returns matching items', () => {
        const query = matchingItem.resolved_url;
        expect( Items.filter( items, query ) ).to.include( matchingItem );
      });

      it( 'does not return non-matching items', () => {
        const query = matchingItem.resolved_url;
        expect( Items.filter( items, query ) ).not.to.include( otherItem );
      });
    });
  });

  context( 'query different case', () => {
    it( 'returns matching items', () => {
      const query = matchingItem.resolved_url.toUpperCase();
      expect( Items.filter( items, query ).length ).to.equal( 1 );
    });

    it( 'does not return non-matching items', () => {
      const query = matchingItem.resolved_url;
      expect( Items.filter( items, query ) ).not.to.include( otherItem );
    });
  });
});


describe.skip( 'Items.paginate', () => {

});
