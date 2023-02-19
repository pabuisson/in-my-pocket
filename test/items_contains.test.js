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
      expect(Items.contains(items, "")).to.equal(false)
    })
  })

  context("valid searchItem", () => {
    it("matches nothing returns false", () => {
      const searchFor = "www.a-url-that-doesnt-match.com"
      expect(Items.contains(items, searchFor)).to.equal(false)
    })

    it("partially matches one item returns false", () => {
      const searchFor = "quelque"
      expect(Items.contains(items, searchFor)).to.equal(false)
    })

    it("exactly matches one item returns true", () => {
      const searchFor = matchingItem.url
      expect(Items.contains(items, searchFor)).to.equal(true)
    })

    it("url matches the getpocket URL returns true", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.url
      expect(Items.contains(items, searchFor)).to.equal(true)
    })

    it("url matches the getpocket URL + ID returns true", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).to.equal(true)
    })

    it("url matches the getpocket URL + ID returns true", () => {
      const searchFor = "https://getpocket.com/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).to.equal(true)
    })

    it("url matches the getpocket URL + locale + ID returns true", () => {
      const searchFor = "https://getpocket.com/fr/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).to.equal(true)
    })

    it("url matches the firefox reader URL returns true", () => {
      const searchFor = "about:reader?url=www.quelquepart.fr"
      expect(Items.contains(items, searchFor)).to.equal(true)
    })
  })
})
