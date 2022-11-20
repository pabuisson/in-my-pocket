import Items from "../src/modules/items.js"

describe("Items.areSame", () => {
  const item = { title: "Hello World", tags: ["tag1", "tag2"] }

  describe("identical items", () => {
    it("returns true if same title and same tags in same order", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2"] }
      expect(Items.areSame(item, otherItem)).to.equal(true)
    })

    it("returns true if same title and same tags in different order", () => {
      const otherItem = { title: "Hello World", tags: ["tag2", "tag1"] }
      expect(Items.areSame(item, otherItem)).to.equal(true)
    })

    it("returns true if same title and same tags but other attributes are provided (they'll be ignored)", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2"], otherKey: "other value" }
      expect(Items.areSame(item, otherItem)).to.equal(true)
    })
  })

  describe("difference in tags", () => {
    it("returns false if same title but removed a tag", () => {
      const otherItem = { title: "Hello World", tags: ["tag1"] }
      expect(Items.areSame(item, otherItem)).to.equal(false)
    })

    it("returns false if same title but added a tag", () => {
      const otherItem = { title: "Hello World", tags: ["tag1", "tag2", "tag3"] }
      expect(Items.areSame(item, otherItem)).to.equal(false)
    })

    it("returns false if same title but different tags", () => {
      const otherItem = { title: "Hello World", tags: ["otherTag"] }
      expect(Items.areSame(item, otherItem)).to.equal(false)
    })
  })

  it("returns false if same tags but different title", () => {
    const otherItem = { title: "Bonjour le Monde", tags: ["tag1", "tag2"] }
    expect(Items.areSame(item, otherItem)).to.equal(false)
  })

  it("does not crash if tags is undefined for an item", () => {
    const otherItem = { title: "Hello World" }
    expect(Items.areSame(item, otherItem)).to.equal(false)
  })
})
