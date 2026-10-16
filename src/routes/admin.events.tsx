import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/events")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Events</h1>,
});
