import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/glossary/")({
  head: () => ({ meta: [{'title': 'Glossary | Northbeat admin'}, {'name': 'description', 'content': 'Glossary for Northbeat.'}, {'property': 'og:title', 'content': 'Glossary | Northbeat admin'}, {'property': 'og:description', 'content': 'Glossary for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  validateSearch: parseListSearch,
  component: Page,
});

function Page() {
  return <EntityList entity="glossary" filters={Route.useSearch()} />;
}
