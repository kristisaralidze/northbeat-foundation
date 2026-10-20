import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/opportunities/")({
  validateSearch: parseListSearch,
  head: () => ({ meta: [{ title: 'Opportunities admin | Northbeat' }, { name: 'description', content: 'Manage and import Northbeat opportunities.' }, { property: 'og:title', content: 'Opportunities admin | Northbeat' }, { property: 'og:description', content: 'Manage and import Northbeat opportunities.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return <EntityList entity="opportunities" filters={Route.useSearch()} />;
}
