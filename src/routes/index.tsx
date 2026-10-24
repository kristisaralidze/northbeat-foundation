import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LaboratoryWordmark } from "@/components/site/LaboratoryWordmark";
import { LivingCells } from "@/components/site/LivingCells";
import { livingCellsQuery } from "@/lib/ecosystem.query";
import { HeartbeatHero } from "@/components/site/HeartbeatHero";
import { heartbeatQuery } from "@/lib/heartbeat.query";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(heartbeatQuery),
    context.queryClient.ensureQueryData(livingCellsQuery),
  ]),
  head: () => ({
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&display=swap" }],
    meta: [
      { title: "Northbeat: The heartbeat of Nordic health innovation." },
      { name: "description", content: "The reference hub for Nordic health ventures: companies, investors, programmes, funding, events and jobs." },
      { property: "og:title", content: "Northbeat: The heartbeat of Nordic health innovation." },
      { property: "og:description", content: "We track Nordic health innovation so you don't miss it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Plays the wordmark writing intro once per visit; any scroll, click or key skips it. */
function useWordmarkIntro() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done) return;
    let played = false;
    try { played = sessionStorage.getItem('nb-wordmark-played') === '1'; } catch { /* private mode */ }
    if (played || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDone(true); return; }
    const finish = () => {
      setDone(true);
      try { sessionStorage.setItem('nb-wordmark-played', '1'); } catch { /* private mode */ }
    };
    const timer = window.setTimeout(finish, 4300);
    window.addEventListener('scroll', finish, { once: true, passive: true });
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('keydown', finish, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', finish);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [done]);
  return done;
}

function Index() {
  const wordmarkDone = useWordmarkIntro();
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const hero = document.querySelector<HTMLElement>('.nb-home-wordmark-section');
    const shell = document.querySelector<HTMLElement>('.nb-home-shell');
    const big = hero?.querySelector<SVGSVGElement>('.nb-home-wordmark-slot svg');
    const tagline = hero?.querySelector<HTMLElement>('.nb-home-tagline');
    const navLogo = shell?.querySelector<HTMLElement>('.nb-home-header-logo svg');
    const header = shell?.querySelector<HTMLElement>('header');
    if (!hero || !shell || !big || !navLogo || !header) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const restore = () => { delete shell.dataset['heroVisible']; if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; };
    if (reduced) {
      const io = new IntersectionObserver(([entry]) => { shell.dataset['heroVisible'] = String(entry?.isIntersecting ?? false); }, { rootMargin: '-64px 0px 0px 0px' });
      io.observe(hero);
      return () => { io.disconnect(); restore(); };
    }
    // Wordmark glide: measure untransformed rects, then move with translate + scale only.
    let start = { x: 0, y: 0, w: 1 }, end = { x: 0, y: 0, w: 1 }, span = 1, raf = 0;
    const measure = () => {
      big.style.transform = '';
      const b = big.getBoundingClientRect(), n = navLogo.getBoundingClientRect();
      start = { x: b.left, y: b.top + window.scrollY, w: b.width || 1 };
      end = { x: n.left, y: n.top, w: n.width || 1 };
      span = Math.max(1, hero.offsetHeight - header.offsetHeight);
      apply();
    };
    const apply = () => {
      raf = 0;
      const y = window.scrollY, p = Math.min(1, Math.max(0, y / span));
      const s = 1 + (end.w / start.w - 1) * p;
      const tx = (end.x - start.x) * p, ty = (end.y - start.y) * p + y;
      big.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
      big.style.opacity = p >= 1 ? '0' : '1';
      if (tagline) tagline.style.opacity = String(Math.max(0, 1 - p / 0.4));
      shell.dataset['heroVisible'] = String(p < 1);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(hero); ro.observe(header);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(() => setTimeout(measure, 50));
    return () => { ro.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure); big.style.transform = ''; big.style.opacity = ''; restore(); };
  }, []);
  return (
    <div className="nb-home-story">
      <section className={`nb-home-wordmark-section${wordmarkDone ? '' : ' nb-wordmark-animated'}`}>
        <div className="nb-home-opening-content">
          <div className="nb-home-wordmark-slot"><LaboratoryWordmark /></div>
          <p className="nb-home-tagline">The heartbeat of Nordic health innovation.</p>
        </div>
      </section>
      <HeartbeatHero />
      <LivingCells />
      <section className="nb-home-learn nb-container">
        <h2 className="nb-network-heading">Start with Learn</h2>
        <p>From your first idea to funding and validation. Guides and a glossary for building in health.</p>
        <Link to="/learn" search={{}} className="nb-link">Explore Learn</Link>
      </section>
    </div>
  );
}
