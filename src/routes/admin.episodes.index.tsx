import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/episodes/")({
  head: () => ({ meta: [{'title': 'Episodes | Northbeat admin'}, {'name': 'description', 'content': 'Episodes for Northbeat.'}, {'property': 'og:title', 'content': 'Episodes | Northbeat admin'}, {'property': 'og:description', 'content': 'Episodes for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  validateSearch: parseListSearch,
  component: Page,
});

function Page() {
  return <EntityList entity="episodes" filters={Route.useSearch()} />;
}
