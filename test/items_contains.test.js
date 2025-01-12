import Items from "../src/modules/items.ts"

describe("Items.contains", () => {
  const matchingItem = { id: "1234", title: "french", url: "www.quelquepart.fr" }
  const otherItem = { id: "5678", title: "other", url: "www.somewherelse.com" }
  const items = JSON.stringify([matchingItem, otherItem])

  describe("invalid searchedItem", () => {
    test("no item given returns false", () => {
      expect(Items.contains(items)).toBe(false)
    })

    test("empty item given returns false", () => {
      expect(Items.contains(items, "")).toBe(false)
    })
  })

  describe("valid searchItem", () => {
    test("matches nothing returns false", () => {
      const searchFor = "www.a-url-that-doesnt-match.com"
      expect(Items.contains(items, searchFor)).toBe(false)
    })

    test("partially matches one item returns false", () => {
      const searchFor = "quelque"
      expect(Items.contains(items, searchFor)).toBe(false)
    })

    test("exactly matches one item returns true", () => {
      const searchFor = matchingItem.url
      expect(Items.contains(items, searchFor)).toBe(true)
    })

    test("url matches the getpocket URL returns true", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.url
      expect(Items.contains(items, searchFor)).toBe(true)
    })

    test("url matches the getpocket URL + ID returns true", () => {
      const searchFor = "https://app.getpocket.com/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).toBe(true)
    })

    test("url matches the getpocket URL + ID returns true", () => {
      const searchFor = "https://getpocket.com/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).toBe(true)
    })

    test("url matches the getpocket URL + locale + ID returns true", () => {
      const searchFor = "https://getpocket.com/fr/read/" + matchingItem.id
      expect(Items.contains(items, searchFor)).toBe(true)
    })

    test("url matches the firefox reader URL returns true", () => {
      const searchFor = "about:reader?url=www.quelquepart.fr"
      expect(Items.contains(items, searchFor)).toBe(true)
    })
  })
})
