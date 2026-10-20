import { createFileRoute } from "@tanstack/react-router";
import { EntityEdit } from "@/components/admin/EntityEdit";

export const Route = createFileRoute("/admin/events/$id")({
  head: () => ({ meta: [{'title': 'Edit events | Northbeat admin'}, {'name': 'description', 'content': 'Edit events for Northbeat.'}, {'property': 'og:title', 'content': 'Edit events | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit events for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return <EntityEdit key={id} entity="events" id={id} />;
}
