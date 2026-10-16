import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/organisations")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Organisations</h1>,
});
