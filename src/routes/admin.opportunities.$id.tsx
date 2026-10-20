import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/opportunities/$id")({
  head: () => ({ meta: [{'title': 'Edit opportunities | Northbeat admin'}, {'name': 'description', 'content': 'Edit opportunities for Northbeat.'}, {'property': 'og:title', 'content': 'Edit opportunities | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit opportunities for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="opportunities" id={id} />;
}
