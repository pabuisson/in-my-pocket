import FeatureSwitch from "../src/modules/feature_switches.js"
import Items from "../src/modules/items.js"

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
    expect(Items.filter(items, "").length).to.equal(4)
  })

  it("returns all items if query is undefined", () => {
    expect(Items.filter(items, undefined).length).to.equal(4)
  })

  it("returns all items if query is null", () => {
    expect(Items.filter(items, null).length).to.equal(4)
  })

  context("with a given current item", () => {
    it("does not return the item with given currentUrl in the item list", () => {
      const result = Items.filter(items, null, matchingItem.url)
      expect(result.length).to.equal(3)
      expect(result).not.to.deep.include(matchingItem)
    })

    it("does not return the item with given currentUrl if considering reader url", () => {
      const readerUrl = "about:reader?url=" + encodeURIComponent(matchingItem.url)
      const result = Items.filter(items, null, readerUrl)
      expect(result.length).to.equal(3)
      expect(result).not.to.deep.include(matchingItem)
    })

    it("does not return the item with given currentUrl if considering getpocket url with item url", () => {
      const getpocketUrl = "https://app.getpocket.com/read/" + matchingItem.url
      const result = Items.filter(items, null, getpocketUrl)
      expect(result.length).to.equal(3)
      expect(result).not.to.deep.include(matchingItem)
    })

    it("does not return the item with given currentUrl if considering getpocket url with item id", () => {
      const getpocketUrl = "https://app.getpocket.com/read/" + matchingItem.id
      const result = Items.filter(items, null, getpocketUrl)
      expect(result.length).to.equal(3)
      expect(result).not.to.deep.include(matchingItem)
    })
  })

  context("query on title", () => {
    context("with same case", () => {
      it("returns matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).to.deep.include(matchingItem)
      })

      it("filters out non-matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).not.to.include(otherItem)
      })
    })

    context("with different case", () => {
      it("returns matching items", () => {
        const query = matchingItem.title.toUpperCase()
        expect(Items.filter(items, query)).to.deep.include(matchingItem)
      })

      it("does not return non-matching items", () => {
        const query = matchingItem.title
        expect(Items.filter(items, query)).not.to.include(otherItem)
      })
    })
  })

  context("query on url", () => {
    context("query on protocol", () => {
      it("www is not taken into account", () => {
        const query = "www"
        const result = Items.filter(items, query)
        expect(result).not.to.deep.include(matchingItem)
        expect(result).not.to.deep.include(otherItem)
      })

      it("http is not taken into account", () => {
        const query = "https"
        const result = Items.filter(items, query)
        expect(result).not.to.deep.include(matchingItem)
        expect(result).not.to.deep.include(otherItem)
      })
    })

    context("with same case", () => {
      it("returns matching items", () => {
        const query = "quelquepart"
        expect(Items.filter(items, query)).to.deep.include(matchingItem)
      })

      it("does not return non-matching items", () => {
        const query = "quelquepart"
        expect(Items.filter(items, query)).not.to.include(otherItem)
      })
    })

    context("query different case", () => {
      it("returns matching items", () => {
        const query = "QUELQUEPART"
        expect(Items.filter(items, query).length).to.equal(1)
      })

      it("does not return non-matching items", () => {
        const query = "QUELQUEPART"
        expect(Items.filter(items, query)).not.to.include(otherItem)
      })
    })
  })

  context("favorites", () => {
    context("query on favorites", () => {
      it("returns favorite items if query contains is:faved", () => {
        const query = "is:faved"
        expect(Items.filter(items, query)).to.deep.include(favedItem)
      })

      it("does not return unfaved items if query contains is:faved", () => {
        const query = "is:faved"
        const result = Items.filter(items, query)
        expect(result).not.to.include(matchingItem)
        expect(result).not.to.include(otherItem)
      })

      it("returns non-favorite items if query contains is:unfaved", () => {
        const query = "is:unfaved"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingItem)
        expect(result).to.deep.include(otherItem)
      })

      it("does not return favorite items if query contains is:unfaved", () => {
        const query = "is:unfaved"
        expect(Items.filter(items, query)).not.to.include(favedItem)
      })
    })

    context("query on favorites + text", () => {
      const matchingTextAndFav = { title: "matching text", url: "https://favorite.com", fav: "1" }
      const matchingTextNotFav = { title: "matching text", url: "https://favorite.com", fav: "0" }
      const matchingFavNotText = { title: "other text", url: "https://other.com", fav: "1" }
      const items = JSON.stringify([matchingTextAndFav, matchingTextNotFav, matchingFavNotText])

      it("returns items matching on title and favorited if query contains is:faved", () => {
        const query = "is:faved favorite"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingTextAndFav)
        expect(result).not.to.include(matchingTextNotFav)
        expect(result).not.to.include(matchingFavNotText)
      })

      it("returns items matching on url and favorited if query contains is:faved", () => {
        const query = "is:faved favorite.com"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingTextAndFav)
        expect(result).not.to.include(matchingTextNotFav)
        expect(result).not.to.include(matchingFavNotText)
      })
    })
  })

  context("tags (if FeatureSwitch.TAGS_ENABLED)", () => {
    before(function () {
      FeatureSwitch.TAGS_ENABLED = true
    })
    after(function () {
      FeatureSwitch.TAGS_ENABLED = false
    })

    context("query on tagged status", () => {
      it("returns tagged items if query contains is:tagged", () => {
        const query = "is:tagged"
        expect(Items.filter(items, query)).to.deep.include(taggedItem)
      })

      it("does not return untagged items if query contains is:tagged", () => {
        const query = "is:tagged"
        const result = Items.filter(items, query)
        expect(result).not.to.deep.include(matchingItem)
        expect(result).not.to.deep.include(otherItem)
        expect(result).not.to.deep.include(favedItem)
      })

      it("returns non-tagged items if query contains is:untagged", () => {
        const query = "is:untagged"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(otherItem)
      })

      it("does not return tagged items if query contains is:untagged", () => {
        const query = "is:untagged"
        const result = Items.filter(items, query)
        expect(result).not.to.deep.include(taggedItem)
      })
    })

    context("query on tagged status + text", () => {
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
        expect(result).to.deep.include(matchingTextWithTag)
        expect(result).not.to.deep.include(matchingTextNoTag)
        expect(result).not.to.deep.include(nonMatchingTextWithTag)
      })

      it("returns items matching on url and tagged if query contains is:tagged", () => {
        const query = "is:tagged tagged.com"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingTextWithTag)
        expect(result).not.to.deep.include(matchingTextNoTag)
        expect(result).not.to.deep.include(nonMatchingTextWithTag)
      })

      it("returns item matching on text and untagged if query contains is:untagged", () => {
        const query = "is:untagged matching"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingTextNoTag)
        expect(result).not.to.deep.include(matchingTextWithTag)
        expect(result).not.to.deep.include(nonMatchingTextWithTag)
      })

      it("returns item matching on url and untagged if query contains is:untagged", () => {
        const query = "is:untagged tagged.com"
        const result = Items.filter(items, query)
        expect(result).to.deep.include(matchingTextNoTag)
        expect(result).not.to.deep.include(matchingTextWithTag)
        expect(result).not.to.deep.include(nonMatchingTextWithTag)
      })
    })

    context("query on item text and tag text", () => {
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
      const items = JSON.stringify([
        matchingTextAndTag,
        matchingTextNotTag,
        matchingTagNotText,
        notMatchingAnything,
      ])

      it("returns items matching on title or tag", () => {
        const query = "matching"
        const result = Items.filter(items, query)
        // Both
        expect(result).to.deep.include(matchingTextAndTag)
        // Text only
        expect(result).to.deep.include(matchingTextNotTag)
        // Tag only
        expect(result).to.deep.include(matchingTagNotText)
        expect(result).not.to.deep.include(notMatchingAnything)
      })
    })
  })

  context("combinining tagged and favorited status (if FeatureSwitch.TAGS_ENABLED)", () => {
    before(function () {
      FeatureSwitch.TAGS_ENABLED = true
    })
    after(function () {
      FeatureSwitch.TAGS_ENABLED = false
    })

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
    const items = JSON.stringify([
      favoritedAndTagged,
      favoritedNotTagged,
      unfavedAndTagged,
      unfavedNotTagged,
    ])

    it("is:faved is:tagged returns items matching both", () => {
      const query = "is:faved is:tagged"
      const result = Items.filter(items, query)
      expect(result).to.deep.include(favoritedAndTagged)
      expect(result).not.to.deep.include(favoritedNotTagged)
      expect(result).not.to.deep.include(unfavedAndTagged)
      expect(result).not.to.deep.include(unfavedNotTagged)
    })

    it("is:faved is:untagged returns items faved but no tagged", () => {
      const query = "is:faved is:untagged"
      const result = Items.filter(items, query)
      expect(result).to.deep.include(favoritedNotTagged)
      expect(result).not.to.deep.include(favoritedAndTagged)
      expect(result).not.to.deep.include(unfavedAndTagged)
      expect(result).not.to.deep.include(unfavedNotTagged)
    })

    it("is:unfaved is:tagged returns items unfaved but tagged", () => {
      const query = "is:unfaved is:tagged"
      const result = Items.filter(items, query)
      expect(result).to.deep.include(unfavedAndTagged)
      expect(result).not.to.deep.include(favoritedAndTagged)
      expect(result).not.to.deep.include(favoritedNotTagged)
      expect(result).not.to.deep.include(unfavedNotTagged)
    })

    it("is:unfaved is:untagged returns items neither faved nor tagged", () => {
      const query = "is:unfaved is:untagged"
      const result = Items.filter(items, query)
      expect(result).to.deep.include(unfavedNotTagged)
      expect(result).not.to.deep.deep.include(favoritedAndTagged)
      expect(result).not.to.deep.deep.include(favoritedNotTagged)
      expect(result).not.to.deep.deep.include(unfavedAndTagged)
    })
  })
})
