import { useEffect, useRef, type ReactNode } from 'react';
import type { ScrollTrigger as ScrollTriggerInstance } from 'gsap/ScrollTrigger';

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
            prevent: node => node.id === 'mobile-nav',
            virtualScroll: () => document.body.style.overflow !== 'hidden',
          });
          lenis.on('scroll', ScrollTrigger.update);
          const tick = (seconds: number) => lenis.raf(seconds * 1000);
          gsap.ticker.add(tick);
          gsap.ticker.lagSmoothing(0);

          const restoreWordmark = () => {};
          const notify = (target: Element | null, name: string, progress: number) => target?.dispatchEvent(new CustomEvent(name, { detail: progress }));
          const context = gsap.context(() => {
            const world = story.querySelector<HTMLElement>('.nb-home-world-scene');
            const network = story.querySelector<HTMLElement>('.nb-network-section');
            const svg = network?.querySelector('svg') ?? null;
            if (world && network && svg) {
              notify(svg, 'northbeat:network-progress', 0);
              const progress = { network: 0 };
              const settle = (self: ScrollTriggerInstance, final: boolean) => {
                self.getTween()?.progress(1); self.animation?.progress(final ? 1 : 0);
                notify(svg, 'northbeat:network-progress', final ? 1 : 0);
              };
              gsap.timeline({
                scrollTrigger: {
                  id: 'home-world', trigger: world, start: 'top 64px', end: () => `+=${window.innerHeight * 1.6}`,
                  pin: true, scrub: 0.5, invalidateOnRefresh: true, fastScrollEnd: true,
                  onLeave: self => settle(self, true), onEnterBack: self => settle(self, true), onLeaveBack: self => settle(self, false),
                },
              }).to(progress, { network: 1, duration: 2, ease: 'none', onUpdate: () => notify(svg, 'northbeat:network-progress', progress.network) }, 0);
            }
            const happening = story.querySelector<HTMLElement>('.nb-home-happening');
            const track = happening?.querySelector<HTMLElement>('.nb-home-happening-track');
            const viewport = happening?.querySelector<HTMLElement>('.nb-home-happening-window');
            if (happening && track && viewport) {
              const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
              const settleHappening = (self: ScrollTriggerInstance, final: boolean) => {
                self.getTween()?.progress(1);
                self.animation?.progress(final ? 1 : 0);
                gsap.set(track, { x: final ? -distance() : 0 });
              };
              gsap.to(track, {
                x: () => -distance(), ease: 'none',
                scrollTrigger: {
                  id: 'home-happening', trigger: happening, start: 'clamp(bottom bottom)', end: () => `+=${Math.max(1, distance())}`,
                  pin: true, scrub: 0.5, invalidateOnRefresh: true, fastScrollEnd: true,
                  onLeave: self => settleHappening(self, true),
                  onEnterBack: self => settleHappening(self, true),
                  onLeaveBack: self => settleHappening(self, false),
                  onRefresh: self => { if (self.progress === 1) settleHappening(self, true); else if (self.progress === 0) settleHappening(self, false); },
                },
              });
            }
            gsap.set(shell, { '--home-surface': surfaces[0] });
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: story, start: 'top top', end: 'bottom top', scrub: 0.7 },
              defaults: { ease: 'none' },
            });
            timeline.to(shell, { '--home-surface': surfaces[1], duration: 1 })
              .to(shell, { '--home-surface': surfaces[2], duration: 1 })
              .to(shell, { '--home-surface': surfaces[3], duration: 1 });
          }, story);

          let refreshFrame = 0;
          const refresh = () => {
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
          };
          story.addEventListener('northbeat:globe-ready', refresh);
          const resize = new ResizeObserver(refresh);
          resize.observe(story);
          void document.fonts.ready.then(refresh);
          ScrollTrigger.refresh();
          return () => {
            resize.disconnect();
            cancelAnimationFrame(refreshFrame);
            story.removeEventListener('northbeat:globe-ready', refresh);
            gsap.ticker.remove(tick);
            lenis.off('scroll', ScrollTrigger.update);
            lenis.destroy();
            context.revert();
            restoreWordmark();
            story.classList.remove('nb-home-motion');
            notify(story.querySelector('.nb-network-figure'), 'northbeat:network-progress', 1);
            notify(story.querySelector('.nb-globe-stage'), 'northbeat:globe-progress', 1);
            notify(story.querySelector('.nb-globe-stage'), 'northbeat:globe-zoom', 0);
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