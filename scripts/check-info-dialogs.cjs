// The language buttons and the consent link open the same information dialog with
// different copy; this prints what both builds show.
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGETS = { dist: 'http://localhost:3222/index.html', next: 'http://localhost:3111/' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readDialog = (page) =>
  page.evaluate(() => ({
    open: document.getElementById('information').open,
    title: document.getElementById('info-title').textContent,
    copy: document.getElementById('info-copy').textContent,
  }));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  for (const [name, url] of Object.entries(TARGETS)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3200);

    for (const [label, selector] of [
      ['ET', '[data-language=ET]'],
      ['EN', '[data-language=EN]'],
      ['privacy-footer', '.footer-bottom [data-info]'],
      ['privacy-consent', '.inquiry-form .consent [data-info]'],
    ]) {
      await page.evaluate((s) => document.querySelector(s).click(), selector);
      await sleep(350);
      console.log(name.padEnd(5), label.padEnd(16), JSON.stringify(await readDialog(page)));
      await page.evaluate(() => {
        const dialog = document.getElementById('information');
        dialog.close();
      });
      await sleep(250);
    }
    await page.close();
  }
  await browser.close();
  console.log('INFO-DONE');
})();
