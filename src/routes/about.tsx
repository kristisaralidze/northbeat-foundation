import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Northbeat" },
      { name: "description", content: "Northbeat is the reference hub for Nordic health, medtech and biotech startups." },
      { property: "og:title", content: "About — Northbeat" },
      { property: "og:description", content: "Northbeat is the reference hub for Nordic health, medtech and biotech startups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="About" />,
});
