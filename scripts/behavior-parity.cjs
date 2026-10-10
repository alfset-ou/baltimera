// Runs the same interactions against the designer's build and the Next.js build
// and prints one JSON snapshot per step so the two can be compared.
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGETS = { dist: 'http://localhost:3222/index.html', next: 'http://localhost:3111/' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function snap(page, label) {
  const state = await page.evaluate(() => {
    const text = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.textContent.trim() : null;
    };
    const attr = (selector, name) => {
      const el = document.querySelector(selector);
      return el ? el.getAttribute(name) : null;
    };
    const dialogState = (id) => {
      const el = document.getElementById(id);
      return el ? { open: el.open, body: document.body.classList.contains('dialog-open') } : null;
    };
    const form = document.querySelector('.inquiry-form');
    return {
      htmlClass: document.documentElement.className,
      header: attr('.site-header', 'class'),
      current: [...document.querySelectorAll('.desktop-nav a')].map((a) => `${a.getAttribute('href')}=${a.getAttribute('aria-current')}`).join(','),
      menu: dialogState('mobile-menu'),
      menuExpanded: attr('.menu-toggle', 'aria-expanded'),
      lightbox: dialogState('lightbox'),
      counter: text('#photo-counter'),
      caption: text('#photo-caption'),
      lightboxImage: (document.querySelector('#lightbox-image') || {}).getAttribute
        ? document.querySelector('#lightbox-image').getAttribute('src')
        : null,
      moreHidden: document.querySelector('.more-gallery') ? document.querySelector('.more-gallery').hidden : null,
      moreFirstHidden: document.querySelector('.more-gallery .project-image') ? document.querySelector('.more-gallery .project-image').hidden : null,
      loadMoreHidden: document.querySelector('#load-more') ? document.querySelector('#load-more').hidden : null,
      galleryCount: text('#gallery-count'),
      focused: document.activeElement ? (document.activeElement.className || document.activeElement.tagName) : null,
      nameError: text('#name-error'),
      contactError: text('#contact-error'),
      consentError: text('#consent-error'),
      nameInvalid: attr('input[name=name]', 'aria-invalid'),
      contactInvalid: attr('input[name=contact]', 'aria-invalid'),
      nameDescribedBy: attr('input[name=name]', 'aria-describedby'),
      formResultHidden: document.querySelector('.form-result') ? document.querySelector('.form-result').hidden : null,
      formChildrenHidden: form ? [...form.children].map((c) => c.hidden) : null,
      formResultFocused: document.activeElement === document.querySelector('.form-result'),
      nameFocused: document.activeElement === document.querySelector('input[name=name]'),
      info: dialogState('information'),
      infoTitle: text('#info-title'),
      infoCopyLength: (text('#info-copy') || '').length,
      model: (() => {
        const el = document.querySelector('#panel-model');
        if (!el) return null;
        const canvas = el.querySelector('canvas');
        const gate = el.querySelector('.model-entry');
        return {
          className: el.className,
          canvasTabIndex: canvas.tabIndex,
          gateHidden: gate.hidden,
          gateDisabled: gate.disabled,
          gateLabel: gate.querySelector('.model-entry-label').textContent,
          fallbackSrc: el.querySelector('.model-fallback').getAttribute('src'),
          finish: el.dataset.finish,
          pressed: [...el.querySelectorAll('.model-color')].map((b) => b.getAttribute('aria-pressed')).join(','),
        };
      })(),
      detailsOpen: [...document.querySelectorAll('.manufacturing-steps details')].map((d) => d.open),
      heroHeight: getComputedStyle(document.querySelector('.hero-inner')).height,
      heroVar: document.querySelector('.hero-inner').style.getPropertyValue('--mobile-hero-height'),
      scrolledSticky: document.querySelector('.site-header').className.includes('scrolled'),
      reveals: document.querySelectorAll('.scroll-reveal.is-visible').length,
      revealsTotal: document.querySelectorAll('.scroll-reveal').length,
      motionReady: document.documentElement.classList.contains('motion-ready'),
    };
  });
  console.log(JSON.stringify({ label, ...state }));
}

async function run(browser, name, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(3600); // let the first-visit entrance finish
  await snap(page, `${name}:load`);

  await page.evaluate(() => window.scrollTo(0, 600));
  await sleep(700);
  await snap(page, `${name}:scrolled`);

  await page.evaluate(() => document.querySelector('#works').scrollIntoView());
  await sleep(1200);
  await snap(page, `${name}:at-works`);

  // Gallery lightbox
  await page.click('.project-image');
  await sleep(400);
  await snap(page, `${name}:lightbox-open`);
  await page.click('#photo-next');
  await sleep(300);
  await snap(page, `${name}:lightbox-next`);
  await page.keyboard.press('ArrowRight');
  await sleep(300);
  await snap(page, `${name}:lightbox-arrow`);
  await page.click('#lightbox-close');
  await sleep(400);
  await snap(page, `${name}:lightbox-closed`);

  // Load more
  await page.click('#load-more');
  await sleep(700);
  await snap(page, `${name}:load-more`);

  // Info dialog from the footer
  await page.evaluate(() => document.querySelector('.footer-bottom [data-info]').click());
  await sleep(400);
  await snap(page, `${name}:info-open`);
  await page.evaluate(() => document.querySelector('.info-dialog .close-info').click());
  await sleep(300);

  // Form: empty submit, then a valid submit, then reset
  await page.evaluate(() => document.querySelector('.inquiry-form .submit').click());
  await sleep(300);
  await snap(page, `${name}:form-invalid`);
  await page.type('input[name=name]', 'Иван');
  await page.type('input[name=contact]', '+372 5555 1234');
  await page.click('.consent input');
  await page.evaluate(() => document.querySelector('.inquiry-form .submit').click());
  await sleep(400);
  await snap(page, `${name}:form-valid`);
  await page.click('.reset-form');
  await sleep(400);
  await snap(page, `${name}:form-reset`);

  // 3D model: colours then activation
  await page.evaluate(() => document.querySelector('#panel-model').scrollIntoView({ block: 'center' }));
  await sleep(3500);
  await snap(page, `${name}:model-loaded`);
  await page.evaluate(() => document.querySelector('[data-finish-choice=black]').click());
  await sleep(1200);
  await snap(page, `${name}:model-black`);
  await page.click('.model-entry');
  await sleep(2500);
  await snap(page, `${name}:model-active`);

  // Tablet/mobile: menu, hero height, accordion
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await sleep(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  await snap(page, `${name}:mobile`);
  await page.evaluate(() => document.querySelector('.menu-toggle').click());
  await sleep(400);
  await snap(page, `${name}:menu-open`);
  await page.evaluate(() => document.querySelector('.mobile-menu nav a').click());
  await sleep(600);
  await snap(page, `${name}:menu-closed`);

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
  console.log('BEHAVIOUR-DONE');
})();
