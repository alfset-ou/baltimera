// Focused probes: navigation highlight at fixed scroll positions, the model
// viewer's focus handover, and which layer of the model stage is visible.
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGETS = { dist: 'http://localhost:3222/index.html', next: 'http://localhost:3111/' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(browser, name, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3600);

  const height = await page.evaluate(() => document.body.scrollHeight);
  const positions = [];
  for (let y = 0; y <= height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await sleep(350);
    const active = await page.evaluate(
      () =>
        [...document.querySelectorAll('.desktop-nav a')]
          .filter((a) => a.getAttribute('aria-current'))
          .map((a) => a.getAttribute('href'))
          .join(',') || 'none',
    );
    const model = await page.evaluate(() => {
      const el = document.querySelector('#panel-model');
      return el ? el.className : 'none';
    });
    positions.push(`${y}:${active}:${model}`);
  }
  console.log(JSON.stringify({ name, step: 'nav-scroll', value: positions.join(' ') }));

  // Focus handover in the model viewer.
  await page.evaluate(() => document.querySelector('#panel-model').scrollIntoView({ block: 'center' }));
  await sleep(3500);
  const before = await page.evaluate(() => ({
    active: document.activeElement.tagName,
    ready: document.querySelector('#panel-model').classList.contains('model-ready'),
    fallbackDisplay: getComputedStyle(document.querySelector('.model-fallback')).display,
    canvasBox: (() => {
      const r = document.querySelector('#panel-model canvas').getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    })(),
    canvasBacking: (() => {
      const c = document.querySelector('#panel-model canvas');
      return `${c.width}x${c.height}`;
    })(),
    fallbackSrc: document.querySelector('.model-fallback').getAttribute('src'),
  }));
  console.log(JSON.stringify({ name, step: 'model-before-activate', ...before }));

  await page.click('.model-entry');
  await sleep(1200);
  const after = await page.evaluate(() => ({
    active: document.activeElement.tagName,
    activeClass: document.activeElement.className,
    gateDisabled: document.querySelector('.model-entry').disabled,
    viewer: document.querySelector('#panel-model').className,
  }));
  console.log(JSON.stringify({ name, step: 'model-after-activate', ...after }));

  // Keyboard control on the canvas (the designer's arrow-key rotation).
  await page.keyboard.press('ArrowRight');
  await sleep(600);
  const keys = await page.evaluate(() => document.activeElement.tagName);
  console.log(JSON.stringify({ name, step: 'model-keyboard', focused: keys }));

  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    for (const [name, url] of Object.entries(TARGETS)) await run(browser, name, url);
  } finally {
    await browser.close();
  }
  console.log('PROBE-DONE');
})();
