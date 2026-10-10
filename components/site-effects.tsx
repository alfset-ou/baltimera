'use client';

import { useEffect } from 'react';

// The designer's app.js, kept as browser behaviour rather than React state:
// these four routines only own CSS classes, a transform and one custom property
// on markup that React never re-renders again.
export function SiteEffects() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    window.__baltimeraReveals = true;
    startReveals(cleanups);
    startDepthParallax(cleanups);
    startManufacturingSteps(cleanups);
    startMobileHeroHeight(cleanups);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return null;
}

/** One-time section entrance, independent of navigation and the 3D viewer. */
function startReveals(cleanups: (() => void)[]): void {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cancelled = false;
  let teardown: (() => void) | null = null;

  const begin = () => {
    if (cancelled || preference.matches || !('IntersectionObserver' in window)) return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.scroll-reveal'));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: '0px 0px -24px 0px' },
    );

    elements.forEach((element) => {
      if (element.matches('.project')) {
        const columns = window.matchMedia('(max-width:700px)').matches ? 2 : 3;
        const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
        element.style.setProperty('--reveal-delay', `${(index % columns) * 70}ms`);
      }
      observer.observe(element);
    });

    const showAll = () => {
      elements.forEach((element) => element.classList.add('is-visible'));
      observer.disconnect();
      document.documentElement.classList.remove('motion-ready');
    };

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) showAll();
    };

    preference.addEventListener('change', onPreferenceChange);
    window.addEventListener('beforeprint', showAll);

    teardown = () => {
      observer.disconnect();
      preference.removeEventListener('change', onPreferenceChange);
      window.removeEventListener('beforeprint', showAll);
    };
  };

  const startWhenReady = () => begin();
  const introPending =
    document.documentElement.classList.contains('intro-active') && !window.__baltimeraIntroDone;

  if (introPending) window.addEventListener('baltimera:intro-complete', startWhenReady, { once: true });
  else startWhenReady();

  cleanups.push(() => {
    cancelled = true;
    window.removeEventListener('baltimera:intro-complete', startWhenReady);
    teardown?.();
  });
}

/** A shallow parallax inside the architectural photo, without moving layout. */
function startDepthParallax(cleanups: (() => void)[]): void {
  const frame = document.querySelector<HTMLElement>('.architecture-break');
  if (!frame) return;
  const image = frame.querySelector<HTMLElement>('img');
  if (!image) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let scheduled = 0;

  function update(): void {
    scheduled = 0;
    if (motion.matches || !visible) return;
    const rect = frame!.getBoundingClientRect();
    const viewport = window.innerHeight;
    const progress = Math.max(
      -1,
      Math.min(1, (rect.top + rect.height / 2 - viewport / 2) / ((rect.height + viewport) / 2)),
    );
    image!.style.transform = `translate3d(0,${(-progress * rect.height * 0.1).toFixed(2)}px,0)`;
  }

  function schedule(): void {
    if (!scheduled && visible && !motion.matches) scheduled = requestAnimationFrame(update);
  }

  function preference(): void {
    frame!.classList.toggle('depth-enabled', !motion.matches);
    if (motion.matches) {
      image!.style.removeProperty('transform');
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
    } else schedule();
  }

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { rootMargin: '120px' });
  observer.observe(frame);

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  motion.addEventListener('change', preference);
  preference();

  cleanups.push(() => {
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    motion.removeEventListener('change', preference);
    if (scheduled) cancelAnimationFrame(scheduled);
  });
}

/** Mobile processing information stays available without a long stack of paragraphs. */
function startManufacturingSteps(cleanups: (() => void)[]): void {
  const steps = Array.from(document.querySelectorAll<HTMLDetailsElement>('.manufacturing-steps details'));
  if (!steps.length) return;

  const mobile = window.matchMedia('(max-width:700px)');
  const adapt = () => {
    steps.forEach((step, index) => {
      step.open = !mobile.matches || index === 0;
    });
  };

  const listeners: (() => void)[] = [];
  for (const step of steps) {
    const summary = step.querySelector('summary');
    const onClick = (event: Event) => {
      if (!mobile.matches) event.preventDefault();
    };
    const onToggle = () => {
      if (!mobile.matches || !step.open) return;
      for (const other of steps) if (other !== step) other.open = false;
    };
    summary?.addEventListener('click', onClick);
    step.addEventListener('toggle', onToggle);
    listeners.push(() => {
      summary?.removeEventListener('click', onClick);
      step.removeEventListener('toggle', onToggle);
    });
  }

  adapt();
  mobile.addEventListener('change', adapt);

  cleanups.push(() => {
    listeners.forEach((remove) => remove());
    mobile.removeEventListener('change', adapt);
  });
}

/** Position the mobile roof a small, consistent distance below the action buttons. */
function startMobileHeroHeight(cleanups: (() => void)[]): void {
  const heroElement = document.querySelector<HTMLElement>('.hero-inner');
  if (!heroElement) return;
  const hero: HTMLElement = heroElement;
  const actionsElement = hero.querySelector<HTMLElement>('.hero-actions');
  if (!actionsElement) return;
  const actions: HTMLElement = actionsElement;

  const mobile = window.matchMedia('(max-width:700px)');
  const imageWidth = 1037;
  const imageHeight = 1517;
  const roofY = 871;
  let frame = 0;

  function update(): void {
    frame = 0;
    if (!mobile.matches) return;
    let buttonBottom = actions!.offsetHeight;
    let node: HTMLElement | null = actions;
    while (node && node !== hero) {
      buttonBottom += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    const gap = parseFloat(getComputedStyle(actions!).rowGap) || 10;
    const target = buttonBottom + gap * 2;
    const width = hero!.clientWidth;
    const heightFit = (target * imageHeight) / roofY;
    const height =
      heightFit >= (width * imageHeight) / imageWidth
        ? heightFit
        : target + ((imageHeight - roofY) * width) / imageWidth;
    hero!.style.setProperty('--mobile-hero-height', `${Math.ceil(height)}px`);
  }

  function schedule(): void {
    if (!frame) frame = requestAnimationFrame(update);
  }

  let observer: ResizeObserver | undefined;
  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(schedule);
    observer.observe(actions);
    const copy = hero.querySelector('.hero-copy');
    if (copy) observer.observe(copy);
  }
  window.addEventListener('resize', schedule, { passive: true });
  mobile.addEventListener('change', schedule);
  if (document.fonts) document.fonts.ready.then(schedule);
  schedule();

  cleanups.push(() => {
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    mobile.removeEventListener('change', schedule);
    if (frame) cancelAnimationFrame(frame);
  });
}
