// Side-by-side capture of the designer's dist/ build and the Next.js app.
// Chrome is driven through puppeteer-core with prefers-reduced-motion emulated so
// both pages render their final state without animations.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.resolve(__dirname, '..', '.verify');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 900, height: 1100 },
  mobile: { width: 390, height: 844 },
};

const TARGETS = {
  dist: 'http://localhost:3222/index.html',
  next: 'http://localhost:3111/',
};

async function capture(page, url, viewport, name) {
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Walk the page so lazy images and the 3D viewer actually start.
  const height = await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 800));
    return document.body.scrollHeight;
  });
  await new Promise((r) => setTimeout(r, 2500));
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true, captureBeyondViewport: true });
  const state = await page.evaluate(() => {
    const model = document.querySelector('#panel-model');
    return {
      title: document.title,
      height: document.body.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      modelClass: model ? model.className : null,
      canvasDrawn: (() => {
        const canvas = model && model.querySelector('canvas');
        if (!canvas || !canvas.width) return null;
        const probe = document.createElement('canvas');
        probe.width = 24;
        probe.height = 24;
        const ctx = probe.getContext('2d');
        ctx.drawImage(canvas, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) sum += data[i];
        return sum;
      })(),
      pendingImages: [...document.images].filter((i) => !i.complete).length,
      brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    };
  });
  console.log(name, JSON.stringify({ ...state, height }, null, 0));
  return file;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
  });
  try {
    for (const [viewName, viewport] of Object.entries(VIEWPORTS)) {
      for (const [target, url] of Object.entries(TARGETS)) {
        const page = await browser.newPage();
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
        await capture(page, url, viewport, `${target}-${viewName}`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log('done');
})();
