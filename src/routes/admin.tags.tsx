import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/tags")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Tags</h1>,
});
