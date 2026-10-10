// Checks the first-visit entrance in the Next.js app: fresh session, dark screen
// with the brand mark, then the page content revealed.
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve(__dirname, '..', '.verify');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3111/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(200);
  const during = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    introVisible: getComputedStyle(document.querySelector('.site-intro')).display,
    introBackground: getComputedStyle(document.querySelector('.site-intro')).backgroundColor,
    seen: sessionStorage.getItem('baltimera-intro-seen'),
    heroCopyOpacity: getComputedStyle(document.querySelector('.hero-copy')).opacity,
  }));
  console.log('during-intro', JSON.stringify(during));
  await page.screenshot({ path: path.join(OUT, 'intro-next.png') });
  await sleep(3200);
  const after = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    introDisplay: getComputedStyle(document.querySelector('.site-intro')).display,
    heroCopyOpacity: getComputedStyle(document.querySelector('.hero-copy')).opacity,
    revealed: document.querySelectorAll('.scroll-reveal.is-visible').length,
    revealsTotal: document.querySelectorAll('.scroll-reveal').length,
  }));
  console.log('after-intro', JSON.stringify(after));

  // Escape skips the entrance on a second visit in the same session.
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page2.goto('http://localhost:3111/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(150);
  const second = await page2.evaluate(() => ({
    htmlClass: document.documentElement.className,
    introDisplay: getComputedStyle(document.querySelector('.site-intro')).display,
  }));
  console.log('second-visit', JSON.stringify(second));

  await browser.close();
  console.log('INTRO-DONE');
})();
