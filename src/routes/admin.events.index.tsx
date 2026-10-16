import { createFileRoute } from "@tanstack/react-router";
import { EntityList } from "@/components/admin/EntityList";
import { parseListSearch } from "@/lib/admin/search";

export const Route = createFileRoute("/admin/events/")({
  validateSearch: parseListSearch,
  component: Page,
});

function Page() {
  return <EntityList entity="events" filters={Route.useSearch()} />;
}
