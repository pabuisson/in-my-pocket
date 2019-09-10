const {Builder, By, until} = require('selenium-webdriver');

(async function example() {
  // TODO: Firefox
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get('https://www.google.com');
    await driver.findElement(By.name('q')).sendKeys('nehalist');
    await driver.findElement(By.id('tsf')).submit();
    await driver.wait(until.elementLocated(By.id('search')));
    await driver.findElement(By.linkText('nehalist.io')).click();
    await driver.wait(until.titleIs('nehalist.io'));
  } finally {
    await driver.quit();
  }
})();
