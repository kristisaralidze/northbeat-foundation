import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/podcast")({
  head: () => ({
    meta: [
      { title: "Podcast — Northbeat" },
      { name: "description", content: "Conversations with the people building Nordic health startups." },
      { property: "og:title", content: "Podcast — Northbeat" },
      { property: "og:description", content: "Conversations with the people building Nordic health startups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Podcast" />,
});
