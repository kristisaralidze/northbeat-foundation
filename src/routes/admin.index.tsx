import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Overview</h1>,
});
