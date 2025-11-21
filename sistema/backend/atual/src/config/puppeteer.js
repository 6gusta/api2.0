const puppeteer = require('puppeteer');

module.exports = {
  headless: true,
  executablePath: puppeteer.executablePath(),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--no-zygote',
    '--single-process'
  ]
};
