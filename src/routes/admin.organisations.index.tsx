import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/organisations/")({
  validateSearch: parseListSearch,
  head: () => ({ meta: [{ title: 'Organisations admin | Northbeat' }, { name: 'description', content: 'Manage and import Northbeat organisations.' }, { property: 'og:title', content: 'Organisations admin | Northbeat' }, { property: 'og:description', content: 'Manage and import Northbeat organisations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return <EntityList entity="organisations" filters={Route.useSearch()} />;
}
