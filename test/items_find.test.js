import Items from '../src/modules/items.js';

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
