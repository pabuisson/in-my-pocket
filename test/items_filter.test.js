import Items from "../src/modules/items.ts"

describe("Items.filter", () => {
  const matchingItem = { id: 1234, title: "french", url: "https://www.quelquepart.fr" }
  const otherItem = { id: 2345, title: "other", url: "https://www.somewherelse.com", fav: "0" }
  const favedItem = { id: 3456, title: "favorite", url: "https://somefavoriteitem.com", fav: "1" }
  const taggedItem = {
    id: 4567,
    title: "tagged",
    url: "https://sometaggeditem.com",
    tags: ["some-tag"],
  }
  const items = JSON.stringify([matchingItem, otherItem, favedItem, taggedItem])

  it("returns all items if query is empty", () => {
    expect(Items.filter(items, "").length).toBe(4)
  })

  it("returns all items if query is undefined", () => {
    expect(Items.filter(items, undefined).length).toBe(4)
  })

  it("returns all items if query is null", () => {
    expect(Items.filter(items, null).length).toBe(4)
  })

  describe("with a given current item", () => {
    it("does not return the item with given currentUrl in the item list", () => {
      const result = Items.filter(items, null, matchingItem.url)
      expect(result.length).toBe(3)
      expect(result).not.toContainEqual(matchingItem)
    })

    it("does not return the item with given currentUrl if considering reader url", () => {
      const readerUrl = "about:reader?url=" + encodeURIComponent(matchingItem.url)
      const result = Items.filter(items, null, readerUrl)
      expect(result.length).toBe(3)
      expect(result).not.toContainEqual(matchingItem)
    })

    it("does not return the item with given currentUrl if considering getpocket url with item url", () => {
      const getpocketUrl = "https://app.getpocket.com/read/" + matchingItem.url
      const result = Items.filter(items, null, getpocketUrl)
      expect(result.length).toBe(3)
      expect(result).not.toContainEqual(matchingItem)
    })

    it("does not return the item with given currentUrl if considering getpocket url with item id", () => {
      const getpocketUrl = "https://app.getpocket.com/read/" + matchingItem.id
      const result = Items.filter(items, null, getpocketUrl)
      expect(result.length).toBe(3)
      expect(result).not.toContainEqual(matchingItem)
    })
  })

  describe("query on title", () => {
    describe("with same case", () => {
      it("returns matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).toContainEqual(matchingItem)
      })

      it("filters out non-matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).not.toContain(otherItem)
      })
    })

    describe("with different case", () => {
      it("returns matching items", () => {
        const query = matchingItem.title.toUpperCase()
        expect(Items.filter(items, query)).toContainEqual(matchingItem)
      })

      it("does not return non-matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).not.toContain(otherItem)
      })
    })
  })

  describe("query on url", () => {
    describe("query on protocol", () => {
      it("www is not taken into account", () => {
        const query = "www"
        const result = Items.filter(items, query)
        expect(result).not.toContainEqual(matchingItem)
        expect(result).not.toContainEqual(otherItem)
      })

      it("http is not taken into account", () => {
        const query = "https"
        const result = Items.filter(items, query)
        expect(result).not.toContainEqual(matchingItem)
        expect(result).not.toContainEqual(otherItem)
      })
    })

    describe("with same case", () => {
      it("returns matching items", () => {
        const query = "quelquepart"
        expect(Items.filter(items, query)).toContainEqual(matchingItem)
      })

      it("does not return non-matching items", () => {
        const query = "quelquepart"
        expect(Items.filter(items, query)).not.toContain(otherItem)
      })
    })

    describe("query different case", () => {
      it("returns matching items", () => {
        const query = "QUELQUEPART"
        expect(Items.filter(items, query).length).toBe(1)
      })

      it("does not return non-matching items", () => {
        const query = "QUELQUEPART"
        expect(Items.filter(items, query)).not.toContain(otherItem)
      })
    })
  })

  describe("favorites", () => {
    describe("query on favorites", () => {
      it("returns favorite items if query contains is:faved", () => {
        const query = "is:faved"
        expect(Items.filter(items, query)).toContainEqual(favedItem)
      })

      it("does not return unfaved items if query contains is:faved", () => {
        const query = "is:faved"
        const result = Items.filter(items, query)
        expect(result).not.toContain(matchingItem)
        expect(result).not.toContain(otherItem)
      })

      it("returns non-favorite items if query contains is:unfaved", () => {
        const query = "is:unfaved"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingItem)
        expect(result).toContainEqual(otherItem)
      })

      it("does not return favorite items if query contains is:unfaved", () => {
        const query = "is:unfaved"
        expect(Items.filter(items, query)).not.toContain(favedItem)
      })
    })

    describe("query on favorites + text", () => {
      const matchingTextAndFav = { title: "matching text", url: "https://favorite.com", fav: "1" }
      const matchingTextNotFav = { title: "matching text", url: "https://favorite.com", fav: "0" }
      const matchingFavNotText = { title: "other text", url: "https://other.com", fav: "1" }
      const items = JSON.stringify([matchingTextAndFav, matchingTextNotFav, matchingFavNotText])

      it("returns items matching on title and favorited if query contains is:faved", () => {
        const query = "is:faved favorite"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextAndFav)
        expect(result).not.toContain(matchingTextNotFav)
        expect(result).not.toContain(matchingFavNotText)
      })

      it("returns items matching on url and favorited if query contains is:faved", () => {
        const query = "is:faved favorite.com"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextAndFav)
        expect(result).not.toContain(matchingTextNotFav)
        expect(result).not.toContain(matchingFavNotText)
      })
    })
  })

  describe("tags", () => {
    describe("query on tagged status", () => {
      it("returns tagged items if query contains is:tagged", () => {
        const query = "is:tagged"
        expect(Items.filter(items, query)).toContainEqual(taggedItem)
      })

      it("does not return untagged items if query contains is:tagged", () => {
        const query = "is:tagged"
        const result = Items.filter(items, query)
        expect(result).not.toContainEqual(matchingItem)
        expect(result).not.toContainEqual(otherItem)
        expect(result).not.toContainEqual(favedItem)
      })

      it("returns non-tagged items if query contains is:untagged", () => {
        const query = "is:untagged"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(otherItem)
      })

      it("does not return tagged items if query contains is:untagged", () => {
        const query = "is:untagged"
        const result = Items.filter(items, query)
        expect(result).not.toContainEqual(taggedItem)
      })
    })

    describe("query on tagged status + text", () => {
      const matchingTextWithTag = {
        title: "matching text",
        url: "https://tagged.com",
        tags: ["matching-tag"],
      }
      const matchingTextNoTag = { title: "matching text", url: "https://tagged.com", tags: [] }
      const nonMatchingTextWithTag = {
        title: "other text",
        url: "https://something.com",
        tags: ["matching-tag"],
      }
      const items = JSON.stringify([matchingTextWithTag, matchingTextNoTag, nonMatchingTextWithTag])

      it("returns items matching on title and tagged if query contains is:tagged", () => {
        const query = "is:tagged matching text"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextWithTag)
        expect(result).not.toContainEqual(matchingTextNoTag)
        expect(result).not.toContainEqual(nonMatchingTextWithTag)
      })

      it("returns items matching on url and tagged if query contains is:tagged", () => {
        const query = "is:tagged tagged.com"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextWithTag)
        expect(result).not.toContainEqual(matchingTextNoTag)
        expect(result).not.toContainEqual(nonMatchingTextWithTag)
      })

      it("returns item matching on text and untagged if query contains is:untagged", () => {
        const query = "is:untagged matching"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextNoTag)
        expect(result).not.toContainEqual(matchingTextWithTag)
        expect(result).not.toContainEqual(nonMatchingTextWithTag)
      })

      it("returns item matching on url and untagged if query contains is:untagged", () => {
        const query = "is:untagged tagged.com"
        const result = Items.filter(items, query)
        expect(result).toContainEqual(matchingTextNoTag)
        expect(result).not.toContainEqual(matchingTextWithTag)
        expect(result).not.toContainEqual(nonMatchingTextWithTag)
      })
    })

    describe("query on item text and tag text", () => {
      const matchingTextAndTag = {
        title: "matching text",
        url: "https://matching.com",
        tags: ["matching-tag"],
      }
      const matchingTextNotTag = {
        title: "matching text",
        url: "https://matching.com",
        tags: ["other-tag"],
      }
      const matchingTagNotText = {
        title: "other text",
        url: "https://other.com",
        tags: ["matching-tag"],
      }
      const notMatchingAnything = {
        title: "other text",
        url: "https://other.com",
        tags: ["other-tag"],
      }
      const items = JSON.stringify([matchingTextAndTag, matchingTextNotTag, matchingTagNotText, notMatchingAnything])

      it("returns items matching on title or tag", () => {
        const query = "matching"
        const result = Items.filter(items, query)
        // Both
        expect(result).toContainEqual(matchingTextAndTag)
        // Text only
        expect(result).toContainEqual(matchingTextNotTag)
        // Tag only
        expect(result).toContainEqual(matchingTagNotText)
        expect(result).not.toContainEqual(notMatchingAnything)
      })
    })
  })

  describe("combinining tagged and favorited status", () => {
    const favoritedAndTagged = {
      title: "some text",
      url: "https://url.com",
      fav: "1",
      tags: ["some-tag"],
    }
    const favoritedNotTagged = { title: "some text", url: "https://url.com", fav: "1", tags: [] }
    const unfavedAndTagged = {
      title: "some text",
      url: "https://url.com",
      fav: "0",
      tags: ["some-tag"],
    }
    const unfavedNotTagged = { title: "some text", url: "https://url.com", fav: "0", tags: [] }
    const items = JSON.stringify([favoritedAndTagged, favoritedNotTagged, unfavedAndTagged, unfavedNotTagged])

    it("is:faved is:tagged returns items matching both", () => {
      const query = "is:faved is:tagged"
      const result = Items.filter(items, query)
      expect(result).toContainEqual(favoritedAndTagged)
      expect(result).not.toContainEqual(favoritedNotTagged)
      expect(result).not.toContainEqual(unfavedAndTagged)
      expect(result).not.toContainEqual(unfavedNotTagged)
    })

    it("is:faved is:untagged returns items faved but no tagged", () => {
      const query = "is:faved is:untagged"
      const result = Items.filter(items, query)
      expect(result).toContainEqual(favoritedNotTagged)
      expect(result).not.toContainEqual(favoritedAndTagged)
      expect(result).not.toContainEqual(unfavedAndTagged)
      expect(result).not.toContainEqual(unfavedNotTagged)
    })

    it("is:unfaved is:tagged returns items unfaved but tagged", () => {
      const query = "is:unfaved is:tagged"
      const result = Items.filter(items, query)
      expect(result).toContainEqual(unfavedAndTagged)
      expect(result).not.toContainEqual(favoritedAndTagged)
      expect(result).not.toContainEqual(favoritedNotTagged)
      expect(result).not.toContainEqual(unfavedNotTagged)
    })

    it("is:unfaved is:untagged returns items neither faved nor tagged", () => {
      const query = "is:unfaved is:untagged"
      const result = Items.filter(items, query)
      expect(result).toContainEqual(unfavedNotTagged)
      expect(result).not.toContainEqual(favoritedAndTagged)
      expect(result).not.toContainEqual(favoritedNotTagged)
      expect(result).not.toContainEqual(unfavedAndTagged)
    })
  })
})
