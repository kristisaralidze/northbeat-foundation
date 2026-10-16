import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Northbeat" },
      { name: "description", content: "Conferences, pitch competitions, hackathons and meetups for Nordic healthtech founders." },
      { property: "og:title", content: "Events — Northbeat" },
      { property: "og:description", content: "Conferences, pitch competitions, hackathons and meetups for Nordic healthtech founders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Events" />,
});
