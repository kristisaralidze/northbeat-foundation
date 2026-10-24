import type { ReactNode } from 'react';
import { animate, motion, scroll, stagger, useReducedMotion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Soft 300ms fade every time the public page changes. */
export function PageTransition({ children, pathname }: { children: ReactNode; pathname: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
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
  const selector = 'section, .nb-card, [data-reveal], hr, .nb-cover-banner, .nb-cover-strip';
  const pending = new Set<HTMLElement>();
  const seen = new Map<HTMLElement, number>();
  for (const el of page.querySelectorAll<HTMLElement>(selector)) {
    if (el.closest('[data-native-scroll]') || el.closest('.nb-compact-bar')) continue;
    const parent = el.parentElement ?? page;
    const order = seen.get(parent) ?? 0;
    seen.set(parent, order + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(order, 8) * 70}ms`);
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

  // Large images: subtle parallax, 40px of travel at most.
  const heroes = [...page.querySelectorAll<HTMLElement>('.nb-cover-banner, .nb-cover-strip, [data-parallax]')];
  for (const el of heroes) {
    const stop = scroll(animate(el, { y: [-20, 20] }), { target: el, offset: ['start end', 'end start'] });
    cleanups.push(() => {
      stop();
      el.style.transform = '';
    });
  }

  // Big numbers: count up once when they become visible.
  for (const el of page.querySelectorAll<HTMLElement>('.nb-event-fact-value')) {
    const original = el.textContent ?? '';
    const match = original.match(/^([^\d]*)([\d][\d.,]*)(.*)$/);
    if (!match) continue;
    const [, prefix, num, suffix] = match;
    const decimals = num.includes('.') ? (num.split('.')[1] ?? '').length : 0;
    const target = Number(num.replace(/[.,]/g, decimals ? '' : '')) ;
    const parsed = decimals ? Number(num.replace(/,/g, '')) : Number(num.replace(/[.,]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) continue;
    const render = (v: number) => {
      el.textContent = `${prefix}${decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-GB')}${suffix}`;
    };
    render(0);
    const io = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        io.disconnect();
        void animate(0, parsed, { duration: 1.2, ease: EASE, onUpdate: render });
      }
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
    cleanups.push(() => { io.disconnect(); el.textContent = original; });
    void target;
  }

  // Editorial rows: a small image preview follows the cursor (desktop only).
  if (window.matchMedia('(pointer: fine)').matches) {
    const preview = document.createElement('span');
    preview.className = 'nb-row-preview';
    preview.setAttribute('aria-hidden', 'true');
    document.body.appendChild(preview);
    let current: HTMLImageElement | null = null;
    const move = (event: PointerEvent) => {
      preview.style.transform = `translate(${event.clientX + 20}px, ${event.clientY - 56}px)`;
    };
    const over = (event: PointerEvent) => {
      const link = (event.target as HTMLElement).closest?.('a');
      const img = link?.querySelector('img');
      if (link && img instanceof HTMLImageElement && img.src && link.closest('.nb-card, .nb-compact-list, .nb-card-grid, .nb-close-grid')) {
        if (current !== img) {
          current = img;
          const clone = document.createElement('img');
          clone.src = img.currentSrc || img.src;
          clone.alt = '';
          preview.replaceChildren(clone);
        }
        preview.classList.add('is-visible');
        move(event);
      } else if (current) {
        current = null;
        preview.classList.remove('is-visible');
      }
    };
    page.addEventListener('pointermove', move, { passive: true });
    page.addEventListener('pointerover', over, { passive: true });
    cleanups.push(() => {
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerover', over);
      preview.remove();
    });
  }

  return () => cleanups.forEach(fn => fn());
}
