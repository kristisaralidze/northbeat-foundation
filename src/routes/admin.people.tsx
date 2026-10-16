import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/people")({
  component: () => <h1 className="text-xl font-semibold text-foreground">People</h1>,
});
