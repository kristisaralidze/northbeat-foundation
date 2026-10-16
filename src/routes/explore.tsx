import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Northbeat" },
      { name: "description", content: "Browse Nordic health, medtech and biotech startups, investors, programmes and research groups." },
      { property: "og:title", content: "Explore — Northbeat" },
      { property: "og:description", content: "Browse Nordic health, medtech and biotech startups, investors, programmes and research groups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Explore" />,
});
