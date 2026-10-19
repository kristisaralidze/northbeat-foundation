import { createFileRoute } from "@tanstack/react-router";
import { LaboratoryWordmark } from "@/components/site/LaboratoryWordmark";

export const Route = createFileRoute("/")({
  head: () => ({
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
    <div className="nb-home-wordmark-section">
      <LaboratoryWordmark />
    </div>
  );
}
