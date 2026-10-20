import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/episodes/$id")({
  head: () => ({ meta: [{'title': 'Edit episodes | Northbeat admin'}, {'name': 'description', 'content': 'Edit episodes for Northbeat.'}, {'property': 'og:title', 'content': 'Edit episodes | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit episodes for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="episodes" id={id} />;
}
