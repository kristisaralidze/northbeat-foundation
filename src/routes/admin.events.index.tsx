import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/events/")({
  validateSearch: parseListSearch,
  head: () => ({ meta: [{ title: 'Events admin | Northbeat' }, { name: 'description', content: 'Manage and import Northbeat events.' }, { property: 'og:title', content: 'Events admin | Northbeat' }, { property: 'og:description', content: 'Manage and import Northbeat events.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return <EntityList entity="events" filters={Route.useSearch()} />;
}
