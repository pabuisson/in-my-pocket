import Items from '../src/modules/items.js';

describe('Items.filter', () => {
  const matchingItem = { title: 'french', url: 'https://www.quelquepart.fr' };
  const otherItem = { title: 'other',    url: 'https://www.somewherelse.com', fav: '0' };
  const favedItem = { title: 'favorite', url: 'https://somefavoriteitem.com', fav: '1' };
  const taggedItem = { title: 'tagged', url: 'https://sometaggeditem.com', tags: ['some-tag']};
  const items = JSON.stringify([matchingItem, otherItem, favedItem, taggedItem]);

  it('returns all items if query is empty', () => {
    expect(Items.filter(items, '').length).to.equal(4);
  });

  it('returns all items if query is undefined', () => {
    expect(Items.filter(items, undefined).length).to.equal(4);
  });

  it('returns all items if query is null', () => {
    expect(Items.filter(items, null).length).to.equal(4);
  });

  context('query on title', () => {
    context('with same case', () => {
      it('returns matching items', () => {
        const query = matchingItem.title;
        expect(Items.filter(items, query)).to.deep.include(matchingItem);
      });

      it('filters out non-matching items', () => {
        const query = matchingItem.title;
        expect(Items.filter(items, query)).not.to.include(otherItem);
      });
    });

    context('with different case', () => {
      it('returns matching items', () => {
        const query = matchingItem.title.toUpperCase();
        expect(Items.filter(items, query)).to.deep.include(matchingItem);
      });

      it('does not return non-matching items', () => {
        const query = matchingItem.title;
        expect(Items.filter(items, query)).not.to.include(otherItem);
      });
    });
  });

  context('query on url', () => {
    context('query on protocol', () => {
      it('www is not taken into account', () => {
        const query = 'www';
        const result = Items.filter(items, query);
        expect(result).not.to.deep.include(matchingItem);
        expect(result).not.to.deep.include(otherItem);
      });

      it('http is not taken into account', () => {
        const query = 'https';
        const result = Items.filter(items, query);
        expect(result).not.to.deep.include(matchingItem);
        expect(result).not.to.deep.include(otherItem);
      });
    });

    context('with same case', () => {
      it('returns matching items', () => {
        const query = 'quelquepart';
        expect(Items.filter(items, query)).to.deep.include(matchingItem);
      });

      it('does not return non-matching items', () => {
        const query = 'quelquepart';
        expect(Items.filter(items, query)).not.to.include(otherItem);
      });
    });

    context('query different case', () => {
      it('returns matching items', () => {
        const query = 'QUELQUEPART';
        expect(Items.filter(items, query).length).to.equal(1);
      });

      it('does not return non-matching items', () => {
        const query = 'QUELQUEPART';
        expect(Items.filter(items, query)).not.to.include(otherItem);
      });
    });
  });

  context('favorites', () => {
    context('query on favorites', () => {
      it('returns favorite items if query contains is:faved', () => {
        const query = 'is:faved';
        expect(Items.filter(items, query)).to.deep.include(favedItem);
      });

      it('does not return unfaved items if query contains is:faved', () => {
        const query = 'is:faved';
        const result = Items.filter(items, query);
        expect(result).not.to.include(matchingItem);
        expect(result).not.to.include(otherItem);
      });

      it('returns non-favorite items if query contains is:unfaved', () => {
        const query = 'is:unfaved';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingItem);
        expect(result).to.deep.include(otherItem);
      });

      it('does not return favorite items if query contains is:unfaved', () => {
        const query = 'is:unfaved';
        expect(Items.filter(items, query)).not.to.include(favedItem);
      });
    });

    context('query on favorites + text', () => {
      const matchingTextAndFav = { title: 'matching text', url: 'https://favorite.com', fav: '1' };
      const matchingTextNotFav = { title: 'matching text', url: 'https://favorite.com', fav: '0' };
      const matchingFavNotText = { title: 'other text', url: 'https://other.com', fav: '1' };
      const items = JSON.stringify([matchingTextAndFav, matchingTextNotFav, matchingFavNotText]);

      it('returns items matching on title and favorited if query contains is:faved', () => {
        const query = 'is:faved favorite';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextAndFav);
        expect(result).not.to.include(matchingTextNotFav);
        expect(result).not.to.include(matchingFavNotText);
      });

      it('returns items matching on url and favorited if query contains is:faved', () => {
        const query = 'is:faved favorite.com';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextAndFav);
        expect(result).not.to.include(matchingTextNotFav);
        expect(result).not.to.include(matchingFavNotText);
      });
    });
  });

  context('tags', () => {
    context('query on tagged status', () => {
      it('returns tagged items if query contains is:tagged', () => {
        const query = 'is:tagged';
        expect(Items.filter(items, query)).to.deep.include(taggedItem);
      });

      it('does not return untagged items if query contains is:tagged', () => {
        const query = 'is:tagged';
        const result = Items.filter(items, query);
        expect(result).not.to.include(otherItem);
      });

      it('returns non-tagged items if query contains is:untagged', () => {
        const query = 'is:untagged';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(otherItem);
      });

      it('does not return tagged items if query contains is:untagged', () => {
        const query = 'is:untagged';
        const result = Items.filter(items, query);
        expect(Items.filter(items, query)).not.to.include(taggedItem);
      });
    });

    context('query on tagged status + text', () => {
      const matchingTextWithTag = { title: 'matching text', url: 'https://tagged.com', tags: ['matching-tag'] };
      const matchingTextNoTag = { title: 'matching text', url: 'https://tagged.com', tags: [] };
      const nonMatchingTextWithTag = { title: 'other text', url: 'https://something.com', tags: ['matching-tag'] };
      const items = JSON.stringify([matchingTextWithTag, matchingTextNoTag, nonMatchingTextWithTag]);

      it('returns items matching on title and tagged if query contains is:tagged', () => {
        const query = 'is:tagged matching';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextWithTag);
        expect(result).not.to.include(matchingTextNoTag);
        expect(result).not.to.include(nonMatchingTextWithTag);
      });

      it('returns items matching on url and tagged if query contains is:tagged', () => {
        const query = 'is:tagged tagged.com';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextWithTag);
        expect(result).not.to.include(matchingTextNoTag);
        expect(result).not.to.include(nonMatchingTextWithTag);
      });

      it('returns item matching on text and untagged if query contains is:untagged', () => {
        const query = 'is:untagged matching';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextNoTag);
        expect(result).not.to.include(matchingTextWithTag);
        expect(result).not.to.include(nonMatchingTextWithTag);
      });

      it('returns item matching on url and untagged if query contains is:untagged', () => {
        const query = 'is:untagged tagged.com';
        const result = Items.filter(items, query);
        expect(result).to.deep.include(matchingTextNoTag);
        expect(result).not.to.include(matchingTextWithTag);
        expect(result).not.to.include(nonMatchingTextWithTag);
      })
    });

    context('query on item text and tag text', () => {
      const matchingTextAndTag = { title: 'matching text', url: 'https://matching.com', tags: ['matching-tag'] };
      const matchingTextNotTag = { title: 'matching text', url: 'https://matching.com', tags: ['other-tag'] };
      const matchingTagNotText = { title: 'other text', url: 'https://other.com', tags: ['matching-tag'] };
      const notMatchingAnything = { title: 'other text', url: 'https://other.com', tags:['other-tag']};
      const items = JSON.stringify([
        matchingTextAndTag, matchingTextNotTag, matchingTagNotText, notMatchingAnything
      ]);

      it('returns items matching on title or tag', () => {
        const query = 'matching';
        const result = Items.filter(items, query);
        // Both
        expect(result).to.deep.include(matchingTextAndTag);
        // Text only
        expect(result).to.deep.include(matchingTextNotTag);
        // Tag only
        expect(result).to.deep.include(matchingTagNotText);
        expect(result).not.to.include(notMatchingAnything);
      });
    });
  });
});


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


describe('Items.contains', () => {
  const matchingItem = { id: '1234', title: 'french', url: 'www.quelquepart.fr' };
  const otherItem = { id: '5678', title: 'other', url: 'www.somewherelse.com' };
  const items = JSON.stringify([ matchingItem, otherItem ]);

  context('invalid searchedItem', () => {
    it('no item given returns false', () => {
      expect(Items.contains(items)).to.equal(false);
    });

    it('empty item given returns false', () => {
      const searchFor = {};
      expect(Items.contains(items, searchFor)).to.equal(false);
    });

    it('empty item given returns false', () => {
      const searchFor = { field: 'blah' };
      expect(Items.contains(items, searchFor)).to.equal(false);
    });
  });

  context('valid searchItem', () => {
    context('with only id', () => {
      it('matches nothing is false', () => {
        const searchFor = { id: '11111' };
        expect(Items.contains(items, searchFor)).to.equal(false);
      });

      it('partially matches one item id is false', () => {
        const searchFor = { id: '12' };
        expect(Items.contains(items, searchFor)).to.equal(false);
      });

      it('exactly matches one item id returns true', () => {
        const searchFor = { id: matchingItem.id };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

    });

    context('with only url', () => {
      it('matches nothing returns false', () => {
        const searchFor = { url: 'www.a-url-that-doesnt-match.com' };
        expect(Items.contains(items, searchFor)).to.equal(false);
      });

      it('partially matches one item returns false', () => {
        const searchFor = { url: 'quelque' };
        expect(Items.contains(items, searchFor)).to.equal(false);
      });

      it('exactly matches one item returns true', () => {
        const searchFor = { url: matchingItem.url };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

      it('url matches the getpocket URL returns true', () => {
        const searchFor = { url: 'https://app.getpocket.com/read/' + matchingItem.url };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

      it('url matches the getpocket URL + ID returns true', () => {
        const searchFor = { url: 'https://app.getpocket.com/read/' + matchingItem.id };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

      it('url matches the firefox reader URL returns true', () => {
        const searchFor = { url: "about:reader?url=www.quelquepart.fr" };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });
    });

    context('with both id and url', () => {
      it('both match nothing returns false', () => {
        const searchFor = { id: '1111', url: 'www.a-url-that-doesnt-match.com' };
        expect( Items.contains( items, searchFor ) ).to.equal(false);
      });

      it('both match the same item returns true', () => {
        const searchFor = { id: matchingItem.id, url: matchingItem.url };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

      it('id matches nothing, url partially matches something returns false', () => {
        const searchFor = { id: '1111', url: 'quelque' };
        expect(Items.contains(items, searchFor)).to.equal(false);
      });

      it('id matches something, url exactly matches nothing returns true', () => {
        const searchFor = { id: matchingItem.id, url: 'www.a-url-that-doesnot-match.com' };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });

      it('id matches nothing, url exactly matches something returns true', () => {
        const searchFor = { id: '1111', url: matchingItem.url };
        expect(Items.contains(items, searchFor)).to.equal(true);
      });
    });
  });
});

describe('Items.find', () => {
  const matchingItem = { id: '1234', title: 'french', url: 'www.quelquepart.fr' };
  const otherItem = { id: '5678', title: 'other', url: 'www.somewherelse.com' };
  const items = JSON.stringify([ matchingItem, otherItem ]);

  context('invalid searchedItem', () => {
    it('no item given is falsy', () => {
      expect(Items.find(items)).to.be.not.ok;
    });

    it('empty item given is falsy', () => {
      const searchFor = {};
      expect(Items.find(items, searchFor)).to.be.not.ok;
    });

    it('ill-formatted item given is falsy', () => {
      const searchFor = { field: 'blah' };
      expect(Items.find(items, searchFor)).to.be.not.ok;
    });
  });

  context('valid searchItem', () => {
    context('with only id', () => {
      it('matches nothing is falsy', () => {
        const searchFor = { id: '11111' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('partially matches one item id is falsy', () => {
        const searchFor = { id: '12' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('exactly matches one item id returns the item', () => {
        const searchFor = { id: matchingItem.id };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });
    });

    context('with only url', () => {
      it('matches nothing is falsy', () => {
        const searchFor = { url: 'www.a-url-that-doesnt-match.com' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('partially matches one item is falsy', () => {
        const searchFor = { url: 'quelque' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('exactly matches one item returns the item', () => {
        const searchFor = { url: matchingItem.url };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });

      it('url matches the getpocket URL returns the item', () => {
        const searchFor = { url: 'https://app.getpocket.com/read/' + matchingItem.url };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });

      it('url matches the getpocket URL + ID returns the item', () => {
        const searchFor = { url: 'https://app.getpocket.com/read/' + matchingItem.id };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });

      it('url matches the firefox reader URL returns the item', () => {
        const searchFor = { url: "about:reader?url=www.quelquepart.fr" };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });
    });

    context('with both id and url', () => {
      it('both match nothing is falsy', () => {
        const searchFor = { id: '1111', url: 'www.a-url-that-doesnt-match.com' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('both match the same item returns the item', () => {
        const searchFor = { id: matchingItem.id, url: matchingItem.url };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });

      it('id matches nothing, url partially matches something is falsy', () => {
        const searchFor = { id: '1111', url: 'quelque' };
        expect(Items.find(items, searchFor)).to.be.not.ok;
      });

      it('id matches nothing, url exactly matches something returns the item', () => {
        const searchFor = { id: '1111', url: matchingItem.url };
        expect(Items.find(items, searchFor)).to.eql(matchingItem);
      });
    });
  });
});
