import { createFileRoute, Link } from "@tanstack/react-router";
import { LaboratoryWordmark } from "@/components/site/LaboratoryWordmark";
import { EMPTY_SEARCH } from "@/lib/explore";
import { EcosystemNetwork } from "@/components/site/EcosystemNetwork";
import { ecosystemQuery } from "@/lib/ecosystem.query";
import { NordicGlobe } from "@/components/site/NordicGlobe";
import { HomeScrollStory } from "@/components/site/HomeScrollStory";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ecosystemQuery),
  head: () => ({
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600&display=swap" }],
    meta: [
      { title: "Northbeat: The heartbeat of Nordic health innovation." },
      { name: "description", content: "The reference hub for Nordic health, medtech and biotech startups: companies, investors, programmes, funding, events and jobs." },
      { property: "og:title", content: "Northbeat: The heartbeat of Nordic health innovation." },
      { property: "og:description", content: "We track Nordic health innovation so you don't miss it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <HomeScrollStory>
    <div className="nb-home-wordmark-section">
      <LaboratoryWordmark />
      <div className="nb-home-intro">
        <p className="nb-home-intro-line">
          Map of the Nordic health ecosystem: the companies, the capital, the science and the people behind them.
        </p>
        <div className="nb-home-actions">
          <Link to="/explore" search={EMPTY_SEARCH} className="nb-btn nb-btn-primary">Explore the hub</Link>
          <Link to="/newsletter" className="nb-link">Get the newsletter</Link>
        </div>
      </div>
    </div>
    <EcosystemNetwork />
    <NordicGlobe />
    </HomeScrollStory>
  );
}
