import Utility from "../src/modules/utility.js"

describe("Utility.parseJson", () => {
  it("returns falsy value if can not parse", () => {
    expect(Utility.parseJson({})).to.equal(undefined)
  })

  describe("if json is parsable", () => {
    it("returns an object", () => {
      const jsonString = JSON.stringify({ a: 14 })
      expect(Utility.parseJson(jsonString)).to.be.a("Object")
    })

    it("returns an object with the expected properties", () => {
      const jsonString = JSON.stringify({ a: 14 })
      expect(Utility.parseJson(jsonString)).to.have.property("a", 14)
    })
  })
})

describe("Utility.getType", () => {
  it("return null for null", () => {
    expect(Utility.getType(null)).to.equal("null")
  })

  it("returns undefined for undefined", () => {
    expect(Utility.getType(undefined)).to.equal("undefined")
    expect(Utility.getType()).to.equal("undefined")
  })

  it("returns Array(<size>) for an Array", () => {
    expect(Utility.getType([])).to.equal("Array(0)")
    expect(Utility.getType([1, 2])).to.equal("Array(2)")
  })

  it("returns Object for an object", () => {
    expect(Utility.getType({})).to.equal("object")
    expect(Utility.getType({ k: 1 })).to.equal("object")
  })

  it("returns number for a number", () => {
    expect(Utility.getType(0)).to.equal("number")
    expect(Utility.getType(3.14159)).to.equal("number")
  })

  it("returns string for a string", () => {
    expect(Utility.getType("coucou")).to.equal("string")
  })
})
