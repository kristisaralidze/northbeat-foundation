import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/newsletter")({
  head: () => ({ meta: [{'title': 'Newsletter | Northbeat'}, {'name': 'description', 'content': 'Newsletter for Northbeat.'}, {'property': 'og:title', 'content': 'Newsletter | Northbeat'}, {'property': 'og:description', 'content': 'Newsletter for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: () => <Outlet />,
});
