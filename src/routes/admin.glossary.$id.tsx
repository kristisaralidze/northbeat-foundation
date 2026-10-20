import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/glossary/$id")({
  head: () => ({ meta: [{'title': 'Edit glossary | Northbeat admin'}, {'name': 'description', 'content': 'Edit glossary for Northbeat.'}, {'property': 'og:title', 'content': 'Edit glossary | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit glossary for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="glossary" id={id} />;
}
