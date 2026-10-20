import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/guides/$id")({
  head: () => ({ meta: [{'title': 'Edit guides | Northbeat admin'}, {'name': 'description', 'content': 'Edit guides for Northbeat.'}, {'property': 'og:title', 'content': 'Edit guides | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit guides for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="guides" id={id} />;
}
