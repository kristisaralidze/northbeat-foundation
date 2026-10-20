import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/people/$id")({
  head: () => ({ meta: [{'title': 'Edit people | Northbeat admin'}, {'name': 'description', 'content': 'Edit people for Northbeat.'}, {'property': 'og:title', 'content': 'Edit people | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit people for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="people" id={id} />;
}
