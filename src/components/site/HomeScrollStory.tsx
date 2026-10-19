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
            gsap.set(shell, { '--home-surface': surfaces[0] });
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: story, start: 'top top', end: 'bottom top', scrub: 0.7 },
              defaults: { ease: 'none' },
            });
            timeline.to(shell, { '--home-surface': surfaces[1], duration: 1 })
              .to(shell, { '--home-surface': surfaces[2], duration: 1 })
              .to(shell, { '--home-surface': surfaces[3], duration: 1 });
            timeline.to('.nb-home-intro', { y: -20, duration: 1 }, 0)
              .fromTo('.nb-network-section .nb-network-heading', { y: 18 }, { y: 0, duration: 1 }, 0)
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