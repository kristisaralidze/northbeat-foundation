import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LaboratoryWordmark } from "@/components/site/LaboratoryWordmark";
import { AtmosphericImage } from "@/components/site/AtmosphericImage";
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

function Index() {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const hero = document.querySelector('.nb-home-wordmark-section');
    const shell = document.querySelector<HTMLElement>('.nb-home-shell');
    if (!hero || !shell) return;
    const io = new IntersectionObserver(([entry]) => { shell.dataset['heroVisible'] = String(entry?.isIntersecting ?? false); }, { rootMargin: '-64px 0px 0px 0px' });
    io.observe(hero);
    return () => { io.disconnect(); delete shell.dataset['heroVisible']; if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; };
  }, []);
  return (
    <div className="nb-home-story">
      <section className="nb-home-wordmark-section">
        <div className="nb-arrival-atmosphere"><AtmosphericImage eager /></div>
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
