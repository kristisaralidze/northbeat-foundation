import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/guides/")({
  head: () => ({ meta: [{'title': 'Guides | Northbeat admin'}, {'name': 'description', 'content': 'Guides for Northbeat.'}, {'property': 'og:title', 'content': 'Guides | Northbeat admin'}, {'property': 'og:description', 'content': 'Guides for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  validateSearch: parseListSearch,
  component: Page,
});

function Page() {
  return <EntityList entity="guides" filters={Route.useSearch()} />;
}
