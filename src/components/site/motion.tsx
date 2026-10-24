import type { ReactNode } from 'react';
import { animate, motion, scroll, stagger, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade-and-rise transition every time the public page changes. */
export function PageTransition({ children, pathname }: { children: ReactNode; pathname: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Shimmering placeholder shown while a route loads. */
export function PageSkeleton() {
  return (
    <div className="nb-container nb-page-skeleton" aria-hidden="true">
      <div className="nb-skeleton nb-skeleton-title" />
      <div className="nb-skeleton nb-skeleton-line" />
      <div className="nb-skeleton-grid">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="nb-skeleton nb-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

/**
 * Scroll-driven polish for one public page: word-by-word headline reveal,
 * staggered section/card reveals and subtle parallax on cover images.
 * Runs only when reduced motion is off; returns a full cleanup.
 */
export function enhancePageMotion(page: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const cleanups: Array<() => void> = [];

  // Headline: reveal word by word (only when the heading is plain text).
  const heading = page.querySelector<HTMLElement>('[data-page-title], h1:not(.nb-laboratory-wordmark)');
  if (heading && heading.children.length === 0 && heading.textContent?.trim()) {
    const words = heading.textContent.trim().split(/\s+/);
    heading.textContent = '';
    const spans = words.map((word, index) => {
      const span = document.createElement('span');
      span.className = 'nb-motion-word';
      span.textContent = word;
      heading.appendChild(span);
      if (index < words.length - 1) heading.appendChild(document.createTextNode(' '));
      return span;
    });
    void animate(spans, { opacity: [0, 1], y: ['0.4em', 0] }, { duration: 0.5, delay: stagger(0.05), ease: EASE });
    cleanups.push(() => {
      heading.textContent = words.join(' ');
    });
  }

  // Sections and cards: CSS keeps them hidden (SSR-consistent class on the
  // page root, so no hydration mismatch); we only add the revealed class.
  // A scroll-position check (not IntersectionObserver) so anchor jumps and
  // fast scrolling past a section still reveal it.
  const selector = 'section, .nb-card, [data-reveal]';
  const pending = new Set<HTMLElement>();
  const seen = new Map<HTMLElement, number>();
  for (const el of page.querySelectorAll<HTMLElement>(selector)) {
    if (el.closest('[data-native-scroll]') || el.closest('.nb-compact-bar')) continue;
    const parent = el.parentElement ?? page;
    const order = seen.get(parent) ?? 0;
    seen.set(parent, order + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(order, 5) * 60}ms`);
    pending.add(el);
  }
  let ticking = false;
  const revealPassed = () => {
    ticking = false;
    const line = window.innerHeight * 0.92;
    for (const el of pending) {
      if (el.getBoundingClientRect().top <= line) {
        el.classList.add('nb-revealed');
        pending.delete(el);
      }
    }
    if (pending.size === 0) window.removeEventListener('scroll', onScroll);
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(revealPassed);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  revealPassed();
  cleanups.push(() => {
    window.removeEventListener('scroll', onScroll);
    for (const el of pending) {
      el.classList.remove('nb-revealed');
      el.style.removeProperty('--reveal-delay');
    }
    pending.clear();
  });
  // Content added later (for example the past-events toggle) must stay visible.
  const late = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          if (node.matches(selector)) node.classList.add('nb-revealed');
          node.querySelectorAll(selector).forEach(el => el.classList.add('nb-revealed'));
        }
      });
    }
  });
  late.observe(page, { childList: true, subtree: true });
  cleanups.push(() => late.disconnect());

  // Cover images: gentle parallax while they cross the viewport.
  const images = [...page.querySelectorAll<HTMLElement>('.nb-cover-banner img, .nb-cover-strip img, [data-parallax]')];
  for (const img of images) {
    img.style.scale = '1.12';
    const stop = scroll(animate(img, { y: ['-5%', '5%'] }), {
      target: img.parentElement ?? img,
      offset: ['start end', 'end start'],
    });
    cleanups.push(() => {
      stop();
      img.style.scale = '';
      img.style.transform = '';
    });
  }

  return () => cleanups.forEach(fn => fn());
}
