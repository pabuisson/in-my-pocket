import Utility from "../src/modules/utility"

describe("Utility.parseJson", () => {
  test("returns falsy value if can not parse", () => {
    expect(Utility.parseJson({})).toBeUndefined()
  })

  describe("if json is parsable", () => {
    test("returns an object", () => {
      const jsonString = JSON.stringify({ a: 14 })
      expect(Utility.parseJson(jsonString)).toBeInstanceOf(Object)
    })

    test("returns an object with the expected properties", () => {
      const jsonString = JSON.stringify({ a: 14 })
      const result = Utility.parseJson(jsonString)

      expect(result.a).toEqual(14)
    })
  })
})

describe("Utility.getType", () => {
  test("return null for null", () => {
    expect(Utility.getType(null)).toBe("null")
  })

  test("returns undefined for undefined", () => {
    expect(Utility.getType(undefined)).toBe("undefined")
    expect(Utility.getType()).toBe("undefined")
  })

  test("returns Array(<size>) for an Array", () => {
    expect(Utility.getType([])).toBe("Array(0)")
    expect(Utility.getType([1, 2])).toBe("Array(2)")
  })

  test("returns Object for an object", () => {
    expect(Utility.getType({})).toBe("object")
    expect(Utility.getType({ k: 1 })).toBe("object")
  })

  test("returns number for a number", () => {
    expect(Utility.getType(0)).toBe("number")
    expect(Utility.getType(3.14159)).toBe("number")
  })

  test("returns string for a string", () => {
    expect(Utility.getType("coucou")).toBe("string")
  })
})
