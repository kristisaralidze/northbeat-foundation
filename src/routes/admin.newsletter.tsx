import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({ meta: [{'title': 'Newsletter | Northbeat admin'}, {'name': 'description', 'content': 'Newsletter for Northbeat.'}, {'property': 'og:title', 'content': 'Newsletter | Northbeat admin'}, {'property': 'og:description', 'content': 'Newsletter for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: () => <h1 className="text-xl font-semibold text-foreground">Newsletter</h1>,
});
