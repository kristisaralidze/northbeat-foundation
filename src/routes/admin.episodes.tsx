import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/episodes")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Episodes</h1>,
});
