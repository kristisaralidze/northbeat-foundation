import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Only mounted on ordinary public routes; the home owns its existing story. */
export function PublicScrollFrame({ children, pathname }: { children: ReactNode; pathname: string }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [identity, setIdentity] = useState({ title: '', detail: '', image: '', summary: '' });
  useEffect(() => {
    let teardown = () => {};
    const timer = window.setTimeout(() => {
      teardown = initialise();
    }, 250);
    function initialise() {
    const page = root.current;
    const compact = bar.current;
    if (!page || !compact) return () => {};
    let disposed = false;
    let clean = () => {};
    const heading = page.querySelector<HTMLElement>('h1');
    if (!heading) return () => {};
    const identityHost = heading.closest('[data-profile-identity]');
    const sentence = page.querySelector<HTMLElement>('[data-one-sentence]');
    setIdentity({ title: heading.textContent ?? '', detail: identityHost?.getAttribute('data-profile-detail') ?? '', image: identityHost?.querySelector('img')?.src ?? '', summary: sentence?.querySelector('.nb-lead')?.textContent ?? '' });
    void Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const lenis = new Lenis({ duration: 1.05, anchors: true, prevent: node => node.id === 'mobile-nav' || node.closest('[data-native-scroll]') !== null, virtualScroll: () => document.body.style.overflow !== 'hidden' });
        lenis.on('scroll', ScrollTrigger.update);
        const tick = (seconds: number) => lenis.raf(seconds * 1000);
        gsap.ticker.add(tick);
        const context = gsap.context(() => {
          const top = () => heading.getBoundingClientRect().top + window.scrollY;
          const explore = page.querySelector<HTMLElement>('[data-explore-bar]');
          if (explore) {
            gsap.to(page, { '--intro-size': '1.25rem', ease: 'none', scrollTrigger: { trigger: explore, start: () => explore.offsetTop - 64, end: '+=180', scrub: true, invalidateOnRefresh: true } });
          } else {
            gsap.fromTo(compact, { autoAlpha: 0, y: -8 }, { autoAlpha: 1, y: 0, ease: 'none', scrollTrigger: { trigger: heading, start: () => Math.max(0, top() - 140), end: () => Math.max(1, top() - 64), scrub: true, invalidateOnRefresh: true } });
            gsap.fromTo(page, { '--intro-scale': 1 }, { '--intro-scale': .86, ease: 'none', scrollTrigger: { trigger: heading, start: 'top 150px', end: 'bottom 72px', scrub: true } });
          }
          gsap.to(page, { '--public-tint': '65%', ease: 'none', scrollTrigger: { trigger: page, start: 'top top', end: 'bottom bottom', scrub: true } });
          page.querySelectorAll<HTMLElement>('[data-scroll-fill]').forEach(fill => {
            const track = fill.parentElement;
            if (track) gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, transformOrigin: 'top', ease: 'none', scrollTrigger: { trigger: track, start: 'top 65%', end: 'bottom 65%', scrub: true } });
          });
          if (sentence) {
            const summary = compact.querySelector('[data-sticky-sentence]');
            if (summary) ScrollTrigger.create({ trigger: sentence, start: 'bottom 120px', onToggle: self => { (summary as HTMLElement).style.display = self.isActive ? 'block' : 'none'; }, onUpdate: self => { (summary as HTMLElement).style.display = self.progress > 0 ? 'block' : 'none'; } });
          }
          if (pathname.startsWith('/learn/') && pathname !== '/learn/glossary') {
            const reading = compact.querySelector('[data-reading-progress]');
            const body = page.querySelector<HTMLElement>('[data-guide-body]') ?? page;
            if (reading) gsap.fromTo(reading, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', ease: 'none', scrollTrigger: { trigger: body, start: () => Math.max(0, body.getBoundingClientRect().top + scrollY - 180), end: () => Math.max(1, body.getBoundingClientRect().bottom + scrollY - 180), scrub: true } });
          }
          const journey = page.querySelector<HTMLElement>('[data-journey]');
          const steps = journey?.querySelectorAll<HTMLElement>('[data-journey-step]');
          if (journey && steps?.length) {
            ScrollTrigger.create({ trigger: journey, start: 'top 70%', end: 'bottom 120px', onUpdate: self => {
              const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
              journey.dispatchEvent(new CustomEvent('northbeat:journey-step', { detail: index }));
            } });
          }
        }, page);
        return () => { context.revert(); gsap.ticker.remove(tick); lenis.off('scroll', ScrollTrigger.update); lenis.destroy(); };
      });
      clean = () => media.revert();
      void document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    });
    const letters = [...page.querySelectorAll<HTMLElement>('[id^="letter-"]')];
    const updateLetters = () => {
      let current = letters[0]?.id;
      for (const letter of letters) if (letter.getBoundingClientRect().top <= 240) current = letter.id;
      page.querySelectorAll<HTMLAnchorElement>('[aria-label="Letters"] a').forEach(link => { if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', updateLetters, { passive: true });
    updateLetters();
    return () => { disposed = true; clean(); window.removeEventListener('scroll', updateLetters); };
    }
    return () => { window.clearTimeout(timer); teardown(); };
  }, [pathname]);
  return <div ref={root} className="nb-public-page">
    <div ref={bar} className={`nb-compact-bar${pathname === '/explore' ? ' hidden' : ''}`} aria-hidden="true">
      <div className="nb-container nb-compact-identity">
        {identity.detail && (identity.image ? <img src={identity.image} alt="" /> : <span className="nb-compact-monogram">{identity.title.charAt(0)}</span>)}
        <div className="min-w-0"><p className="nb-compact-title">{identity.title}</p>{identity.detail && <p className="nb-compact-detail">{identity.detail}</p>}
          <p data-sticky-sentence className="nb-compact-sentence">{identity.summary ? `In one sentence: ${identity.summary}` : ''}</p>
        </div>
      </div>
      {pathname.startsWith('/learn/') && pathname !== '/learn/glossary' && <span data-reading-progress className="nb-reading-progress" />}
    </div>
    {children}
  </div>;
}