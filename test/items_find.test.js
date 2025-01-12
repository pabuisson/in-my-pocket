import Items from "../src/modules/items.ts"

describe("Items.find", () => {
  const matchingItem = { id: "1234", title: "french", url: "www.quelquepart.fr" }
  const otherItem = { id: "5678", title: "other", url: "www.somewherelse.com" }
  const items = JSON.stringify([matchingItem, otherItem])

  describe("invalid searchedItem", () => {
    test("no item given is falsy", () => {
      expect(Items.findByUrl(items)).toBeFalsy()
    })

    test("empty item given is falsy", () => {
      expect(Items.findByUrl(items, "")).toBeFalsy()
    })
  })

  describe("valid searchItem", () => {
    test("matches nothing is falsy", () => {
      const searchFor = "www.a-url-that-doesnt-match.com"
      expect(Items.findByUrl(items, searchFor)).toBeFalsy()
    })

    test("partially matches one item is falsy", () => {
      const searchFor = "quelque"
      expect(Items.findByUrl(items, searchFor)).toBeFalsy()
    })

    test("exactly matches one item returns the item", () => {
      const searchFor = matchingItem.url
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })

    test("url matches the getpocket URL returns the item", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.url
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })

    test("url matches the getpocket URL + ID returns the item", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.id
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })

    test("url matches the getpocket URL + ID returns the item", () => {
      const searchFor = "https://getpocket.com/read/" + matchingItem.id
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })

    test("url matches the getpocket URL + locale + ID returns the item", () => {
      const searchFor = "https://getpocket.com/fr/read/" + matchingItem.id
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })

    test("url matches the firefox reader URL returns the item", () => {
      const searchFor = "about:reader?url=www.quelquepart.fr"
      expect(Items.findByUrl(items, searchFor)).toEqual(matchingItem)
    })
  })
})
