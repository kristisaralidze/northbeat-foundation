import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/data-protection")({
  beforeLoad: () => { throw redirect({ to: "/privacy", statusCode: 301 }); },
});