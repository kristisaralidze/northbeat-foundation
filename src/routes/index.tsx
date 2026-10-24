import { createFileRoute, Link } from "@tanstack/react-router";
import { EcosystemNetwork } from "@/components/site/EcosystemNetwork";
import { ecosystemQuery } from "@/lib/ecosystem.query";
import { HomeScrollStory } from "@/components/site/HomeScrollStory";
import { HomeHappening } from "@/components/site/HomeHappening";
import { HeartbeatHero } from "@/components/site/HeartbeatHero";
import { heartbeatQuery } from "@/lib/heartbeat.query";
import { eventsQuery } from "@/lib/events.query";
import { opportunitiesQuery } from "@/lib/opportunities.query";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(heartbeatQuery),
    context.queryClient.ensureQueryData(ecosystemQuery),
    context.queryClient.ensureQueryData(eventsQuery),
    context.queryClient.ensureQueryData(opportunitiesQuery),
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
  return (
    <HomeScrollStory>
    <HeartbeatHero />
    <div className="nb-home-world-scene">
      <EcosystemNetwork />
    </div>
    <HomeHappening />
    <section className="nb-home-learn nb-container">
      <h2 className="nb-network-heading">Start with Learn</h2>
      <p>From your first idea to funding and validation. Guides and a glossary for building in health.</p>
      <Link to="/learn" search={{}} className="nb-link">Explore Learn</Link>
    </section>
    </HomeScrollStory>
  );
}
