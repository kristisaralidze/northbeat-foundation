import { createFileRoute } from "@tanstack/react-router";
import { DesignDirections } from "@/components/site/DesignDirections";

export const Route = createFileRoute("/directions")({
  head: () => ({
    meta: [
      { title: "Northbeat: Design directions" },
      { name: "description", content: "Three design directions for Northbeat: Stained slide, Nordic field chart and Specimen archive." },
      { property: "og:title", content: "Northbeat: Design directions" },
      { property: "og:description", content: "The same Nordic health content in three distinct visual directions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Schibsted+Grotesk:wght@400;500;600;700;800&display=swap" }],
  }),
  component: DesignDirections,
});