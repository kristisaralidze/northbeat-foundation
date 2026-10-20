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

          let restoreWordmark = () => {};
          const notify = (target: Element | null, name: string, progress: number) => target?.dispatchEvent(new CustomEvent(name, { detail: progress }));
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
              shell.append(wordmark);
              restoreWordmark = () => slot.append(wordmark);
              gsap.set(wordmark, { position: 'fixed', zIndex: 45, pointerEvents: 'none', margin: 0 });
              gsap.set(intro, { autoAlpha: 0 });
              const docking = gsap.timeline({
                scrollTrigger: {
                  id: 'home-opening',
                  trigger: opening, start: 'top 64px', end: () => `+=${window.innerHeight * 0.85}`,
                  pin: true, scrub: 0.5, invalidateOnRefresh: true, fastScrollEnd: true,
                  onLeave: self => { self.getTween()?.progress(1); self.animation?.progress(1); gsap.set(wordmark, dockBounds()); },
                  onEnterBack: self => { self.getTween()?.progress(1); self.animation?.progress(1); gsap.set(wordmark, dockBounds()); },
                  onLeaveBack: self => { self.getTween()?.progress(1); self.animation?.progress(0); gsap.set(wordmark, startBounds()); },
                  onRefresh: self => { if (self.progress === 1) { self.animation?.progress(1); gsap.set(wordmark, dockBounds()); } else if (self.progress === 0) { self.animation?.progress(0); gsap.set(wordmark, startBounds()); } },
                },
              });
              docking.fromTo(wordmark,
                { left: () => startBounds().left, top: () => startBounds().top, width: () => startBounds().width },
                { left: () => dockBounds().left, top: () => dockBounds().top, width: () => dockBounds().width, duration: 1, ease: 'none' }, 0)
                .to('.nb-home-tagline', { autoAlpha: 0, duration: 0.5, ease: 'none' }, 0.25)
                .to('.nb-arrival-atmosphere', { autoAlpha: 0, duration: 1, ease: 'none' }, 0)
                .to('.nb-arrival-atmosphere img', { yPercent: 4, duration: 1, ease: 'none' }, 0)
                .set(intro, { autoAlpha: 1 }, 1)
                .fromTo('.nb-home-intro-word', { opacity: 0 }, { opacity: 1, duration: 0.06, stagger: 0.008, ease: 'none' }, 1)
                .fromTo('.nb-home-actions', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'none' }, 1.22);
              docking.set(dock.children, { autoAlpha: 1 }, 1).set(wordmark, { autoAlpha: 0 }, 1);
            }
            const world = story.querySelector<HTMLElement>('.nb-home-world-scene');
            const network = story.querySelector<HTMLElement>('.nb-network-section');
            const svg = network?.querySelector('svg') ?? null;
            const globe = story.querySelector<HTMLElement>('.nb-globe-section');
            const globeWrapper = story.querySelector<HTMLElement>('.nb-home-globe-wrapper');
            const stage = globe?.querySelector('.nb-globe-stage') ?? null;
            if (world && network && svg && globe && globeWrapper && stage) {
              gsap.set(world, { height: 'min(calc(100svh - 4rem), 900px)', position: 'relative' });
              gsap.set([network, globeWrapper], { position: 'absolute', inset: 0, height: '100%' });
              gsap.set(globeWrapper, { autoAlpha: 0, yPercent: 65, scale: .18 });
              gsap.set(stage, { pointerEvents: 'none' });
              gsap.set('.nb-home-globe-line', { autoAlpha: 0 });
              notify(svg, 'northbeat:network-progress', 0);
              notify(stage, 'northbeat:globe-progress', 0);
              notify(stage, 'northbeat:globe-zoom', 0);
              const progress = { network: 0, globe: 0, zoom: 0 };
              const settleWorld = (self: ScrollTriggerInstance, final: boolean) => {
                self.getTween()?.progress(1);
                self.animation?.progress(final ? 1 : 0);
                notify(svg, 'northbeat:network-progress', final ? 1 : 0);
                notify(stage, 'northbeat:globe-progress', final ? 1 : 0);
                notify(stage, 'northbeat:globe-zoom', final ? 1 : 0);
                if (final) {
                  gsap.set(globeWrapper, { autoAlpha: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 });
                  gsap.set(stage, { pointerEvents: 'auto' });
                  stage.dispatchEvent(new CustomEvent('northbeat:globe-settle'));
                }
              };
              const worldTimeline = gsap.timeline({
                scrollTrigger: {
                  id: 'home-world', trigger: world, start: 'top 64px', end: () => `+=${window.innerHeight * 3.4}`,
                  pin: true, scrub: 0.5, invalidateOnRefresh: true, fastScrollEnd: true,
                  onLeave: self => settleWorld(self, true),
                  onEnterBack: self => settleWorld(self, true),
                  onLeaveBack: self => settleWorld(self, false),
                  onRefresh: self => { if (self.progress === 1) settleWorld(self, true); else if (self.progress === 0) settleWorld(self, false); },
                },
              });
              worldTimeline.to(progress, { network: 1, duration: 2, ease: 'none', onUpdate: () => notify(svg, 'northbeat:network-progress', progress.network) }, 0)
                .to(network, { scale: .015, autoAlpha: 0, duration: .9, ease: 'none' }, 2)
                .to(globeWrapper, { autoAlpha: 1, yPercent: 0, scale: 1, duration: .9, ease: 'none' }, 2)
                .to(progress, { globe: 1, duration: .9, ease: 'none', onUpdate: () => notify(stage, 'northbeat:globe-progress', progress.globe) }, 2)
                .to('.nb-home-globe-line', { autoAlpha: 1, duration: .15, ease: 'none' }, 2.75)
                .set(stage, { pointerEvents: 'auto' }, 2.9)
                .to(progress, { zoom: 1, duration: .5, ease: 'none', onUpdate: () => notify(stage, 'northbeat:globe-zoom', progress.zoom) }, 2.9);
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
                  id: 'home-happening', trigger: happening, start: 'clamp(top 64px)', end: () => `clamp(+=${Math.max(1, distance())})`,
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