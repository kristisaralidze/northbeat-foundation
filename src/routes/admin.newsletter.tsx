import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/newsletter")({
  component: () => <h1 className="text-xl font-semibold text-foreground">Newsletter</h1>,
});
