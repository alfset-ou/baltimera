// Release check against the deployed site: console errors, failed requests,
// the 3D viewer, the lightbox and the form, plus one full-page screenshot.
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.argv[2] || 'https://baltimera.vercel.app/';
const OUT = path.resolve(__dirname, '..', '.verify');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push('console: ' + message.text().slice(0, 200));
  });
  page.on('pageerror', (error) => problems.push('pageerror: ' + String(error).slice(0, 200)));
  page.on('requestfailed', (request) =>
    problems.push('requestfailed: ' + request.url().slice(0, 120) + ' ' + (request.failure() || {}).errorText),
  );
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push('http ' + response.status() + ' ' + response.url().slice(0, 120));
  });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3600);

  const intro = await page.evaluate(() => ({
    introActiveGone: !document.documentElement.classList.contains('intro-active'),
    revealed: document.querySelectorAll('.scroll-reveal.is-visible').length,
  }));

  await page.evaluate(() => document.querySelector('#works').scrollIntoView());
  await sleep(1000);
  await page.click('.project-image');
  await sleep(600);
  const lightbox = await page.evaluate(() => ({
    open: document.getElementById('lightbox').open,
    counter: document.getElementById('photo-counter').textContent,
    image: document.getElementById('lightbox-image').getAttribute('src'),
  }));
  await page.click('#lightbox-close');
  await sleep(400);

  await page.evaluate(() => document.querySelector('#request').scrollIntoView());
  await sleep(600);
  await page.evaluate(() => document.querySelector('.inquiry-form .submit').click());
  await sleep(400);
  const invalid = await page.evaluate(() => document.getElementById('name-error').textContent);
  await page.type('input[name=name]', 'Проверка релиза');
  await page.type('input[name=contact]', '+37255550000');
  await page.click('.consent input');
  await page.evaluate(() => document.querySelector('.inquiry-form .submit').click());
  await sleep(500);
  const result = await page.evaluate(() => ({
    resultVisible: !document.querySelector('.form-result').hidden,
    heading: document.querySelector('.form-result h3').textContent,
  }));

  await page.evaluate(() => document.querySelector('#panel-model').scrollIntoView({ block: 'center' }));
  await sleep(6000);
  const model = await page.evaluate(() => {
    const el = document.querySelector('#panel-model');
    return { className: el.className, image: document.querySelector('.model-fallback').getAttribute('src') };
  });
  await page.click('.model-entry');
  await sleep(2500);
  const modelActive = await page.evaluate(() => ({
    className: document.querySelector('#panel-model').className,
    focused: document.activeElement.tagName,
  }));

  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, 'live-top.png') });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, 'live-middle.png') });

  const images = await page.evaluate(() => {
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src'));
    return { broken: broken.map((i) => i.currentSrc || i.src), total: document.images.length };
  });

  console.log(JSON.stringify({ url: URL, intro, lightbox, invalid, result, model, modelActive, images }, null, 1));
  console.log('PROBLEMS:', problems.length ? problems : 'none');
  await browser.close();
  console.log('LIVE-DONE');
})();
