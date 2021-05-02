import Items from "../src/modules/items.js"

describe("Items.contains", () => {
  const matchingItem = { id: "1234", title: "french", url: "www.quelquepart.fr" }
  const otherItem = { id: "5678", title: "other", url: "www.somewherelse.com" }
  const items = JSON.stringify([matchingItem, otherItem])

  context("invalid searchedItem", () => {
    it("no item given returns false", () => {
      expect(Items.contains(items)).to.equal(false)
    })

    it("empty item given returns false", () => {
      const searchFor = {}
      expect(Items.contains(items, searchFor)).to.equal(false)
    })

    it("empty item given returns false", () => {
      const searchFor = { field: "blah" }
      expect(Items.contains(items, searchFor)).to.equal(false)
    })
  })

  context("valid searchItem", () => {
    context("with only id", () => {
      it("matches nothing is false", () => {
        const searchFor = { id: "11111" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("partially matches one item id is false", () => {
        const searchFor = { id: "12" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("exactly matches one item id returns true", () => {
        const searchFor = { id: matchingItem.id }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })
    })

    context("with only url", () => {
      it("matches nothing returns false", () => {
        const searchFor = { url: "www.a-url-that-doesnt-match.com" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("partially matches one item returns false", () => {
        const searchFor = { url: "quelque" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("exactly matches one item returns true", () => {
        const searchFor = { url: matchingItem.url }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("url matches the getpocket URL returns true", () => {
        const searchFor = { url: "https://app.getpocket.com/read/" + matchingItem.url }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("url matches the getpocket URL + ID returns true", () => {
        const searchFor = { url: "https://app.getpocket.com/read/" + matchingItem.id }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("url matches the getpocket URL + ID returns true", () => {
        const searchFor = { url: "https://getpocket.com/read/" + matchingItem.id }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("url matches the firefox reader URL returns true", () => {
        const searchFor = { url: "about:reader?url=www.quelquepart.fr" }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })
    })

    context("with both id and url", () => {
      it("both match nothing returns false", () => {
        const searchFor = { id: "1111", url: "www.a-url-that-doesnt-match.com" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("both match the same item returns true", () => {
        const searchFor = { id: matchingItem.id, url: matchingItem.url }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("id matches nothing, url partially matches something returns false", () => {
        const searchFor = { id: "1111", url: "quelque" }
        expect(Items.contains(items, searchFor)).to.equal(false)
      })

      it("id matches something, url exactly matches nothing returns true", () => {
        const searchFor = { id: matchingItem.id, url: "www.a-url-that-doesnot-match.com" }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })

      it("id matches nothing, url exactly matches something returns true", () => {
        const searchFor = { id: "1111", url: matchingItem.url }
        expect(Items.contains(items, searchFor)).to.equal(true)
      })
    })
  })
})
