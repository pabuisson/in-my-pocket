import browser from "webextension-polyfill"
import Environment from "../src/modules/environment"

describe("Environment.isDevelopment", () => {
  test("returns true if version has 4 groups of digits or more", () => {
    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1.2.2.0" })
    expect(Environment.isDevelopment()).toBe(true)

    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1.2.2.0.0" })
    expect(Environment.isDevelopment()).toBe(true)
  })

  test("returns false if version has 3 groups of digits or fewer", () => {
    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1.2.2" })
    expect(Environment.isDevelopment()).toBe(false)

    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1.2" })
    expect(Environment.isDevelopment()).toBe(false)

    jest.spyOn(browser.runtime, "getManifest").mockReturnValue({ version: "1" })
    expect(Environment.isDevelopment()).toBe(false)
  })
})
