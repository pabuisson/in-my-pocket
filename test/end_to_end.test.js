// const { Builder, By, until } = require("selenium-webdriver");
const { Builder, By } = require("selenium-webdriver")
// const firefox = require("selenium-webdriver/firefox")
// const expect = require("chai").expect

describe.only("firefox with addon", function () {
  let driver

  // https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/firefox_exports_Driver.html
  //

  // OK not too bad. It's mostly working. The unpackaged addon is installed. I only struggle with test and
  // async/await. I don't understand what needs to be async or not, return the promise or not, etc.
  // https://www.selenium.dev/documentation/webdriver/getting_started/first_script/
  //
  // Dans l'état actuel, je ne vois jamais le console.log du test lui-même
  // TODO: check https://mochajs.org/#asynchronous-code qui parle exactement de ça
  //
  // Autre truc bizarre: dans l'état actuel, j'ai 2 lignes comme si before et after étaient des tests
  // (l'output m'affiche d'ailleurs "0 passing, 2 failing")

  // before(async () => {
  //   console.log("(before)")
  //   driver = await new Builder().forBrowser("firefox").build()

  //   // source: https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/node/selenium-webdriver/firefox.js#L671-L700
  //   // * Installs a new addon with the current session. This function will return an
  //   // * ID that may later be used to {@linkplain #uninstallAddon uninstall} the
  //   // * addon.
  //   const isTempAddon = true
  //   await driver.installAddon("/Users/pabuisson/dev/perso/in-my-pocket-addon/build/firefox/", isTempAddon)
  // })

  // it("has the addon installed and listed on about:addons", async () => {
  //   console.log("(test)")
  //   await driver.get("about:addons")
  //   await driver.findElement(By.css("button[name='extension']")).click()

  //   // retrieves the text of the element
  //   const pageTitle = await driver.findElement(By.css("h1")).getText()
  //   console.log("page: " + pageTitle)
  //   expect(pageTitle).to.include("Manage Your Extensions")

  //   const addonName = await driver.findElement(By.css("h3")).getText()
  //   console.log("addon: " + addonName)
  //   expect(addonName).to.include("In My Pocket")

  //   console.log("finished test")
  // })

  // after(async () => {
  //   console.log("(after)")
  //   await driver.quit()
  // })

  // NOTE: essayons déjà de faire fonctionner ça dans un test unique, tout ensemble
  // j'ai une erreur "timeout of 2000ms exceeded", mais le test a tourné entièrement
  // apparemment parce que j'arrive au "driver.quit" sans avoir indiqué que le test est fini ?
  it("has the addon installed and listed on about:addons", async () => {
    driver = await new Builder().forBrowser("firefox").build()
    const isTempAddon = true
    await driver.installAddon("/Users/pabuisson/dev/perso/in-my-pocket-addon/build/firefox/", isTempAddon)

    console.log("(test)")
    await driver.get("about:addons")
    await driver.findElement(By.css("button[name='extension']")).click()

    // retrieves the text of the element
    const pageTitle = await driver.findElement(By.css("h1")).getText()
    console.log("page: " + pageTitle)
    expect(pageTitle).to.include("Manage Your Extensions")

    const addonName = await driver.findElement(By.css("h3")).getText()
    console.log("addon: " + addonName)
    expect(addonName).to.include("In My Pocket")

    console.log("finished test")
    driver.quit()
  })
})
