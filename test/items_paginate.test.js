import Items from '../src/modules/items.js';

describe('Items.paginate', () => {
  const item1 = { title: 'item1', url: 'www.site_1.com', created_at: new Date("2018-01-01 12:12").valueOf() };
  const item2 = { title: 'item2', url: 'www.site_2.com', created_at: new Date("2018-01-02 12:12").valueOf() };
  const item3 = { title: 'item3', url: 'www.site_3.com', created_at: new Date("2018-01-03 12:12").valueOf() };
  const item4 = { title: 'item4', url: 'www.site_4.com', created_at: new Date("2018-01-04 12:12").valueOf() };
  const item5 = { title: 'item5', url: 'www.site_5.com', created_at: new Date("2018-01-05 12:12").valueOf() };
  const items = [ item1, item2, item3, item4, item5 ];
  const perPage = 4;

  context('pagination disabled', () => {
    context('perPage undefined', () => {
      it('returns all items', () => {
        expect(Items.paginate(items, 1, undefined)).to.deep.equal(items);
      });

      it('returns all items sorted by antechronological created_at', () => {
        const output = Items.paginate(items, 1, undefined );
        expect(output[0]).to.equal(item5);
        expect(output[1]).to.equal(item4);
        expect(output[2]).to.equal(item3);
        expect(output[3]).to.equal(item2);
        expect(output[4]).to.equal(item1);
      });
    });

    context('perPage is null', () => {
      it('returns all items', () => {
        expect(Items.paginate(items, 1, null)).to.deep.equal(items);
      });

      it('returns all items sorted by antechronological created_at', () => {
        const output = Items.paginate(items, 1, null );
        expect(output[0]).to.equal(item5);
        expect(output[1]).to.equal(item4);
        expect(output[2]).to.equal(item3);
        expect(output[3]).to.equal(item2);
        expect(output[4]).to.equal(item1);
      });
    });

    context('perPage is 0', () => {
      it('returns all items', () => {
        expect(Items.paginate(items, 1, 0)).to.deep.equal(items);
      });

      it('returns all items sorted by antechronological created_at', () => {
        const output = Items.paginate(items, 1, 0 );
        expect(output[0]).to.equal(item5);
        expect(output[1]).to.equal(item4);
        expect(output[2]).to.equal(item3);
        expect(output[3]).to.equal(item2);
        expect(output[4]).to.equal(item1);
      });
    });
  });

  context('not pagineable input', () => {
    it('returns [] if items = []', () => {
      expect(Items.paginate([], 1, perPage)).to.be.empty;
    });

    it('returns nothing if page param is < 0', () => {
      const negativePage = -1;
      expect(Items.paginate(items, negativePage, perPage)).not.to.be.ok;
    });

    it('returns nothing if page param is > max possible page', () => {
      const tooHighPage = 10;
      expect(Items.paginate(items, tooHighPage, perPage)).not.to.be.ok;
    });
  });

  context('pagineable input', () => {
    it('returns all items if perPage > total number of items', () => {
      const highPerPage = 50;
      expect(Items.paginate(items, 1, highPerPage)).to.deep.equal(items);
    });

    it('returns perPage items if perPage < total number of items', () => {
      expect(Items.paginate(items, 1, perPage).length).to.equal(perPage);
    });

    it('sorts the items by antechronological created_at (newest first)', () => {
      const paginatedItems = Items.paginate(items, 1, perPage);
      expect(paginatedItems[0]).to.equal(item5);
      expect(paginatedItems[1]).to.equal(item4);
      expect(paginatedItems[2]).to.equal(item3);
      expect(paginatedItems[3]).to.equal(item2);
    });

    context('given page=1', () => {
      it('returns the items of the 1st page', () => {
        const paginatedItems = Items.paginate(items, 1, perPage);
        expect(paginatedItems).to.include(item5);
        expect(paginatedItems).to.include(item4);
        expect(paginatedItems).to.include(item3);
        expect(paginatedItems).to.include(item2);
      });

      it('does not returns items of other pages', () => {
        const paginatedItems = Items.paginate(items, 1, perPage);
        expect(paginatedItems).not.to.include(item1);
      });
    });

    context('given page=n', () => {
      it('returns the items of the page', () => {
        const secondPage = 2;
        const paginatedItems = Items.paginate(items, secondPage, perPage);
        expect(paginatedItems).to.include(item1);
      });

      it('does not returns items of other pages', () => {
        const secondPage = 2;
        const paginatedItems = Items.paginate(items, secondPage, perPage);
        expect(paginatedItems).not.to.include(item5);
        expect(paginatedItems).not.to.include(item4);
        expect(paginatedItems).not.to.include(item3);
        expect(paginatedItems).not.to.include(item2);
      });
    });
  });
});

