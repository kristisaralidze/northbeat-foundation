import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/submissions")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Submissions</h1>,
});
