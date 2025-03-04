import Items from "../src/modules/items.ts"

describe("Items.areSame", () => {
  const item = { title: "Hello World", tags: ["tag1", "tag2"] }

  describe("identical items", () => {
    test("returns true if same title and same tags in same order", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2"] }
      expect(Items.areSame(item, otherItem)).toBe(true)
    })

    test("returns true if same title and same tags in different order", () => {
      const otherItem = { title: "Hello World", tags: ["tag2", "tag1"] }
      expect(Items.areSame(item, otherItem)).toBe(true)
    })

    test("returns true if same title and same tags but other attributes are provided (they'll be ignored)", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2"], otherKey: "other value" }
      expect(Items.areSame(item, otherItem)).toBe(true)
    })
  })

  describe("difference in tags", () => {
    test("returns false if same title but removed a tag", () => {
      const otherItem = { title: "Hello World", tags: ["tag1"] }
      expect(Items.areSame(item, otherItem)).toBe(false)
    })

    test("returns false if same title but added a tag", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2", "tag3"] }
      expect(Items.areSame(item, otherItem)).toBe(false)
    })

    test("returns false if same title but different tags", () => {
      const otherItem = { title: "Hello World", tags: ["otherTag"] }
      expect(Items.areSame(item, otherItem)).toBe(false)
    })
  })

  test("returns false if same tags but different title", () => {
    const otherItem = { title: "Bonjour le Monde", tags: ["tag1", "tag2"] }
    expect(Items.areSame(item, otherItem)).toBe(false)
  })

  test("does not crash if tags is undefined for an item", () => {
    const otherItem = { title: "Hello World" }
    expect(Items.areSame(item, otherItem)).toBe(false)
  })
})

describe("Items.matches", () => {
  const item = { id: 1234, url: "https://37signals.com/podcast/good-enough-is-fine/" }

  test("matches on firefox reader url", () => {
    const url = "about:reader?url=https%3A%2F%2F37signals.com%2Fpodcast%2Fgood-enough-is-fine%2F"
    expect(Items.matches(item, url)).toBe(true)
  })

  test("matches on any possible string URL", () => {
    const url1 = `https://app.getpocket.com/read/${item.url}`
    const url2 = `https://app.getpocket.com/read/${item.id}`
    const url3 = `https://getpocket.com/read/${item.id}`

    expect(Items.matches(item, url1)).toBe(true)
    expect(Items.matches(item, url2)).toBe(true)
    expect(Items.matches(item, url3)).toBe(true)
  })

  test("matches on any possible regexp URL", () => {
    const url = `https://getpocket.com/fr/read/${item.id}`
    expect(Items.matches(item, url)).toBe(true)
  })

  test("does not match on a different URL", () => {
    const url = "https://something.else.com/"
    expect(Items.matches(item, url)).toBe(false)
  })
})
