import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/people/")({
  head: () => ({ meta: [{'title': 'People | Northbeat admin'}, {'name': 'description', 'content': 'People for Northbeat.'}, {'property': 'og:title', 'content': 'People | Northbeat admin'}, {'property': 'og:description', 'content': 'People for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  validateSearch: parseListSearch,
  component: Page,
});

function Page() {
  return <EntityList entity="people" filters={Route.useSearch()} />;
}
