import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Northbeat" },
      { name: "description", content: "Programme intakes, grant calls, competitions and jobs in Nordic healthtech." },
      { property: "og:title", content: "Opportunities — Northbeat" },
      { property: "og:description", content: "Programme intakes, grant calls, competitions and jobs in Nordic healthtech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Opportunities" />,
});
