import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{'title': 'Index | Northbeat admin'}, {'name': 'description', 'content': 'Index for Northbeat.'}, {'property': 'og:title', 'content': 'Index | Northbeat admin'}, {'property': 'og:description', 'content': 'Index for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: () => <h1 className="text-xl font-semibold text-foreground">Overview</h1>,
});
