import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — Northbeat" },
      { name: "description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic healthtech." },
      { property: "og:title", content: "Newsletter — Northbeat" },
      { property: "og:description", content: "The Northbeat newsletter: funding calls, intakes and events in Nordic healthtech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Newsletter" />,
});
