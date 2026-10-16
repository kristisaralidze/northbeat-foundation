import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Northbeat" },
      { name: "description", content: "How Northbeat handles your personal data." },
      { property: "og:title", content: "Privacy — Northbeat" },
      { property: "og:description", content: "How Northbeat handles your personal data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Privacy" />,
});
