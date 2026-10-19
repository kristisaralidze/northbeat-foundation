import { useEffect, useRef, type ReactNode } from 'react';

/** Owns scroll effects only while the home route is mounted. */
export function HomeScrollStory({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const story = root.current;
    const shell = story?.closest<HTMLElement>('.nb-home-shell');
    if (!story || !shell) return;
    let disposed = false;
    let cleanup = () => {};

    void Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
          // Resolve CSS tokens to sRGB for GSAP, without duplicating the palette.
          const probe = document.createElement('span');
          shell.append(probe);
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d');
          const colour = (token: string) => {
            probe.style.color = `var(${token})`;
            const value = getComputedStyle(probe).color;
            if (!ctx) return value;
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = value;
            ctx.fillRect(0, 0, 1, 1);
            const pixel = ctx.getImageData(0, 0, 1, 1).data;
            return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
          };
          const surfaces = ['--home-opening', '--home-ecosystem', '--home-nordics', '--home-ending'].map(colour);
          probe.remove();

          const lenis = new Lenis({
            duration: 1.05,
            syncTouch: false,
            anchors: true,
            prevent: node => node.id === 'mobile-nav' || node.dataset['wheelActive'] === 'true',
            virtualScroll: () => document.body.style.overflow !== 'hidden',
          });
          lenis.on('scroll', ScrollTrigger.update);
          const tick = (seconds: number) => lenis.raf(seconds * 1000);
          gsap.ticker.add(tick);

          const context = gsap.context(() => {
            const opening = story.querySelector<HTMLElement>('.nb-home-wordmark-section');
            const slot = story.querySelector<HTMLElement>('.nb-home-wordmark-slot');
            const wordmark = story.querySelector<HTMLElement>('.nb-laboratory-wordmark');
            const dock = shell.querySelector<HTMLElement>('.nb-home-header-logo');
            const intro = story.querySelector<HTMLElement>('.nb-home-intro-section');
            if (opening && slot && wordmark && dock && intro) {
              const startBounds = () => {
                const bounds = slot.getBoundingClientRect();
                const section = opening.getBoundingClientRect();
                return { left: bounds.left, top: bounds.top - section.top + 64, width: bounds.width };
              };
              const dockBounds = () => {
                const bounds = dock.getBoundingClientRect();
                const svg = wordmark.querySelector('svg');
                const box = svg?.viewBox.baseVal;
                const height = box && box.width > 0 ? bounds.width * box.height / box.width : bounds.height;
                return { left: bounds.left, top: bounds.top + (bounds.height - height) / 2, width: bounds.width };
              };
              gsap.set(dock.children, { autoAlpha: 0 });
              gsap.set(wordmark, { position: 'fixed', zIndex: 45, pointerEvents: 'none', margin: 0 });
              const docking = gsap.timeline({
                scrollTrigger: {
                  trigger: opening, start: 'top 64px', end: () => `+=${window.innerHeight * 0.85}`,
                  pin: true, scrub: true, invalidateOnRefresh: true,
                },
              });
              docking.fromTo(wordmark,
                { left: () => startBounds().left, top: () => startBounds().top, width: () => startBounds().width },
                { left: () => dockBounds().left, top: () => dockBounds().top, width: () => dockBounds().width, duration: 1, ease: 'none' }, 0)
                .to('.nb-home-tagline', { autoAlpha: 0, duration: 0.5, ease: 'none' }, 0.25);

              const reveal = gsap.timeline({
                scrollTrigger: { trigger: intro, start: 'top 64px', end: () => `+=${window.innerHeight * 0.75}`, pin: true, scrub: true, invalidateOnRefresh: true },
              });
              reveal.fromTo('.nb-home-intro-word', { opacity: 0 }, { opacity: 1, duration: 0.12, stagger: 0.07, ease: 'none' })
                .fromTo('.nb-home-actions', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'none' });
            }
            gsap.set(shell, { '--home-surface': surfaces[0] });
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: story, start: 'top top', end: 'bottom top', scrub: 0.7 },
              defaults: { ease: 'none' },
            });
            timeline.to(shell, { '--home-surface': surfaces[1], duration: 1 })
              .to(shell, { '--home-surface': surfaces[2], duration: 1 })
              .to(shell, { '--home-surface': surfaces[3], duration: 1 });
            timeline.fromTo('.nb-network-section .nb-network-heading', { y: 18 }, { y: 0, duration: 1 }, 0)
              .fromTo('.nb-globe-section .nb-network-heading', { y: 18 }, { y: 0, duration: 1 }, 1);
          }, story);

          const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
          const resize = new ResizeObserver(refresh);
          resize.observe(story);
          void document.fonts.ready.then(refresh);
          ScrollTrigger.refresh();
          return () => {
            resize.disconnect();
            gsap.ticker.remove(tick);
            lenis.off('scroll', ScrollTrigger.update);
            lenis.destroy();
            context.revert();
          };
        });
        cleanup = () => media.revert();
      },
      () => { /* Native scrolling and the visible stacked content remain usable. */ },
    );
    return () => { disposed = true; cleanup(); };
  }, []);

  return <div ref={root} className="nb-home-story">{children}</div>;
}