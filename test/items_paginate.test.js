import Items from "../src/modules/items.ts"

describe("Items.paginate", () => {
  const item1 = {
    title: "item1",
    url: "www.site_1.com",
    created_at: new Date("2018-01-01 12:12").valueOf(),
  }
  const item2 = {
    title: "item2",
    url: "www.site_2.com",
    created_at: new Date("2018-01-02 12:12").valueOf(),
  }
  const item3 = {
    title: "item3",
    url: "www.site_3.com",
    created_at: new Date("2018-01-03 12:12").valueOf(),
  }
  const item4 = {
    title: "item4",
    url: "www.site_4.com",
    created_at: new Date("2018-01-04 12:12").valueOf(),
  }
  const item5 = {
    title: "item5",
    url: "www.site_5.com",
    created_at: new Date("2018-01-05 12:12").valueOf(),
  }
  const items = [item1, item2, item3, item4, item5]
  const perPage = 4

  describe("pagination disabled", () => {
    describe("perPage undefined", () => {
      it("returns all items", () => {
        expect(Items.paginate(items, 1, undefined)).toEqual(items)
      })

      it("returns all items sorted by antechronological created_at", () => {
        const output = Items.paginate(items, 1, undefined)
        expect(output[0]).toEqual(item5)
        expect(output[1]).toEqual(item4)
        expect(output[2]).toEqual(item3)
        expect(output[3]).toEqual(item2)
        expect(output[4]).toEqual(item1)
      })
    })

    describe("perPage is null", () => {
      it("returns all items", () => {
        expect(Items.paginate(items, 1, null)).toEqual(items)
      })

      it("returns all items sorted by antechronological created_at", () => {
        const output = Items.paginate(items, 1, null)
        expect(output[0]).toEqual(item5)
        expect(output[1]).toEqual(item4)
        expect(output[2]).toEqual(item3)
        expect(output[3]).toEqual(item2)
        expect(output[4]).toEqual(item1)
      })
    })

    describe("perPage is 0", () => {
      it("returns all items", () => {
        expect(Items.paginate(items, 1, 0)).toEqual(items)
      })

      it("returns all items sorted by antechronological created_at", () => {
        const output = Items.paginate(items, 1, 0)
        expect(output[0]).toEqual(item5)
        expect(output[1]).toEqual(item4)
        expect(output[2]).toEqual(item3)
        expect(output[3]).toEqual(item2)
        expect(output[4]).toEqual(item1)
      })
    })
  })

  describe("not pagineable input", () => {
    it("returns [] if items = []", () => {
      expect(Items.paginate([], 1, perPage)).toEqual([])
    })

    it("returns nothing if page param is < 0", () => {
      const negativePage = -1
      expect(Items.paginate(items, negativePage, perPage)).toBeFalsy()
    })

    it("returns nothing if page param is > max possible page", () => {
      const tooHighPage = 10
      expect(Items.paginate(items, tooHighPage, perPage)).toBeFalsy()
    })
  })

  describe("pagineable input", () => {
    it("returns all items if perPage > total number of items", () => {
      const highPerPage = 50
      expect(Items.paginate(items, 1, highPerPage)).toEqual(items)
    })

    it("returns perPage items if perPage < total number of items", () => {
      expect(Items.paginate(items, 1, perPage).length).toBe(perPage)
    })

    it("sorts the items by antechronological created_at (newest first)", () => {
      const paginatedItems = Items.paginate(items, 1, perPage)
      expect(paginatedItems[0]).toEqual(item5)
      expect(paginatedItems[1]).toEqual(item4)
      expect(paginatedItems[2]).toEqual(item3)
      expect(paginatedItems[3]).toEqual(item2)
    })

    describe("given page=1", () => {
      it("returns the items of the 1st page", () => {
        const paginatedItems = Items.paginate(items, 1, perPage)
        expect(paginatedItems).toContain(item5)
        expect(paginatedItems).toContain(item4)
        expect(paginatedItems).toContain(item3)
        expect(paginatedItems).toContain(item2)
      })

      it("does not returns items of other pages", () => {
        const paginatedItems = Items.paginate(items, 1, perPage)
        expect(paginatedItems).not.toContain(item1)
      })
    })

    describe("given page=n", () => {
      it("returns the items of the page", () => {
        const secondPage = 2
        const paginatedItems = Items.paginate(items, secondPage, perPage)
        expect(paginatedItems).toContain(item1)
      })

      it("does not returns items of other pages", () => {
        const secondPage = 2
        const paginatedItems = Items.paginate(items, secondPage, perPage)
        expect(paginatedItems).not.toContain(item5)
        expect(paginatedItems).not.toContain(item4)
        expect(paginatedItems).not.toContain(item3)
        expect(paginatedItems).not.toContain(item2)
      })
    })
  })
})
