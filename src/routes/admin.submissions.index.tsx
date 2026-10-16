import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/admin/db";
import { humanize } from "@/lib/admin/entities";
import { SUBMISSION_STATUSES, SUBMISSION_TYPES, type Submission } from "@/lib/admin/submissions";
import { selectClass } from "@/components/admin/EntityList";

type Search = { type?: string; status?: string };

export const Route = createFileRoute("/admin/submissions/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ...(typeof s["type"] === "string" && s["type"] ? { type: s["type"] } : {}),
    ...(typeof s["status"] === "string" && s["status"] ? { status: s["status"] } : {}),
  }),
  component: Inbox,
});

function Inbox() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/submissions/" });
  const q = useQuery({
    queryKey: ["submissions", search],
    queryFn: async () => {
      let query = db.from("submissions").select("id, type, status, name, email, organisation_name, entry_kind, message, created_at").order("created_at", { ascending: false }).limit(500);
      if (search.type) query = query.eq("type", search.type);
      if (search.status) query = query.eq("status", search.status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Submission[];
    },
  });

  const setFilter = (k: keyof Search, v: string) =>
    navigate({ search: (prev: Search) => { const n = { ...prev }; if (v) n[k] = v; else delete n[k]; return n; } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Submissions</h1>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Type" className={selectClass} value={search.type ?? ""} onChange={(e) => setFilter("type", e.target.value)}>
          <option value="">All types</option>
          {SUBMISSION_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
        <select aria-label="Status" className={selectClass} value={search.status ?? ""} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="">All statuses</option>
          {SUBMISSION_STATUSES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
      </div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.error && <p role="alert" className="text-destructive">{(q.error as Error).message}</p>}
      {q.data && q.data.length === 0 && <p className="text-muted-foreground">No submissions.</p>}
      {q.data && q.data.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr><th className="p-2">Received</th><th className="p-2">Type</th><th className="p-2">From</th><th className="p-2">About</th><th className="p-2">Status</th></tr>
            </thead>
            <tbody>
              {q.data.map((s) => (
                <tr key={s.id} className={`border-t border-border hover:bg-accent/40 ${s.status === "new" ? "font-medium" : ""}`}>
                  <td className="p-2 whitespace-nowrap"><Link to="/admin/submissions/$id" params={{ id: s.id }} className="hover:underline">{new Date(s.created_at).toLocaleString()}</Link></td>
                  <td className="p-2">{humanize(s.type)}{s.entry_kind ? ` · ${humanize(s.entry_kind)}` : ""}</td>
                  <td className="p-2">{s.name || s.email || "—"}</td>
                  <td className="p-2 max-w-xs truncate">{s.organisation_name || s.message || "—"}</td>
                  <td className="p-2">{humanize(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
