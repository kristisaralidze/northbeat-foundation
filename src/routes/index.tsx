import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northbeat — the heartbeat of Nordic healthtech" },
      { name: "description", content: "The reference hub for Nordic health, medtech and biotech startups: companies, investors, programmes, funding, events and jobs." },
      { property: "og:title", content: "Northbeat — the heartbeat of Nordic healthtech" },
      { property: "og:description", content: "We track Nordic healthtech so you don't miss it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Home content and hero come later; the global layout wraps this page.
function Index() {
  return (
    <div className="nb-container nb-section min-h-[40vh]">
      <h1 className="sr-only">Northbeat</h1>
    </div>
  );
}
