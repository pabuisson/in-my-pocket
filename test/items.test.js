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


describe( 'Items.paginate', () => {
  const item_1 = { resolved_title: 'item_1', resolved_url: 'www.site_1.com', created_at: new Date("2018-01-01 12:12").valueOf() };
  const item_2 = { resolved_title: 'item_2', resolved_url: 'www.site_2.com', created_at: new Date("2018-01-02 12:12").valueOf() };
  const item_3 = { resolved_title: 'item_3', resolved_url: 'www.site_3.com', created_at: new Date("2018-01-03 12:12").valueOf() };
  const item_4 = { resolved_title: 'item_4', resolved_url: 'www.site_4.com', created_at: new Date("2018-01-04 12:12").valueOf() };
  const item_5 = { resolved_title: 'item_5', resolved_url: 'www.site_5.com', created_at: new Date("2018-01-05 12:12").valueOf() };
  const items = [ item_1, item_2, item_3, item_4, item_5 ];
  const perPage = 4;

  context('not pagineable input', () => {
    it('returns [] if items = []', () => {
      expect( Items.paginate([], 1, perPage) ).to.be.empty;
    });

    it('returns items if perPage is undefined', () => {
      expect( Items.paginate(items, 1, undefined) ).to.deep.equal(items);
    });

    it('returns items if perPage is null', () => {
      expect( Items.paginate(items, 1, null) ).to.deep.equal(items);
    });

    it('returns items if perPage is 0', () => {
      expect( Items.paginate(items, 1, 0) ).to.deep.equal(items);
    });

    it('returns nothing if page param is < 0', () => {
      const negativePage = -1;
      expect( Items.paginate(items, negativePage, perPage) ).not.to.be.ok;
    });

    it('returns nothing if page param is > max possible page', () => {
      const tooHighPage = 10;
      expect( Items.paginate(items, tooHighPage, perPage) ).not.to.be.ok;
    });
  });

  context('pagineable input', () => {
    it('returns all items if perPage > total number of items', () => {
      const highPerPage = 50;
      expect( Items.paginate(items, 1, highPerPage) ).to.deep.equal(items);
    });

    it('returns perPage items if perPage < total number of items', () => {
      expect( Items.paginate(items, 1, perPage).length ).to.equal(perPage);
    });

    it('sorts the items by antechronological created_at (newest first)', () => {
      const paginatedItems = Items.paginate(items, 1, perPage);
      expect( paginatedItems[0] ).to.equal(item_5);
      expect( paginatedItems[1] ).to.equal(item_4);
      expect( paginatedItems[2] ).to.equal(item_3);
      expect( paginatedItems[3] ).to.equal(item_2);
    });

    context('given page=1', () => {
      it('returns the items of the 1st page', () => {
        const paginatedItems = Items.paginate(items, 1, perPage);
        expect( paginatedItems ).to.include( item_5 );
        expect( paginatedItems ).to.include( item_4 );
        expect( paginatedItems ).to.include( item_3 );
        expect( paginatedItems ).to.include( item_2 );
      });

      it('does not returns items of other pages', () => {
        const paginatedItems = Items.paginate(items, 1, perPage);
        expect( paginatedItems ).not.to.include( item_1 );
      });
    });

    context('given page=n', () => {
      it('returns the items of the page', () => {
        const secondPage = 2;
        const paginatedItems = Items.paginate(items, secondPage, perPage);
        expect( paginatedItems ).to.include( item_1 );
      });

      it('does not returns items of other pages', () => {
        const secondPage = 2;
        const paginatedItems = Items.paginate(items, secondPage, perPage);
        expect( paginatedItems ).not.to.include( item_5 );
        expect( paginatedItems ).not.to.include( item_4 );
        expect( paginatedItems ).not.to.include( item_3 );
        expect( paginatedItems ).not.to.include( item_2 );
      });
    });
  });
});
