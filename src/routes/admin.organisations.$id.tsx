import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/organisations/$id")({
  head: () => ({ meta: [{'title': 'Edit organisations | Northbeat admin'}, {'name': 'description', 'content': 'Edit organisations for Northbeat.'}, {'property': 'og:title', 'content': 'Edit organisations | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit organisations for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="organisations" id={id} />;
}
