import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit — Northbeat" },
      { name: "description", content: "Suggest a company, event or opportunity for Northbeat, or apply to be a podcast guest." },
      { property: "og:title", content: "Submit — Northbeat" },
      { property: "og:description", content: "Suggest a company, event or opportunity for Northbeat, or apply to be a podcast guest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PagePlaceholder title="Submit" />,
});
