import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { db, saveEntry } from "@/lib/admin/db";
import { ENTITIES, humanize, type EntityKey } from "@/lib/admin/entities";
import { approvableEntity, buildDraft, ENTITY_TO_KIND, submissionLabel, KIND_TO_ENTITY, type Submission } from "@/lib/admin/submissions";
import { selectClass } from "@/components/admin/EntityList";

export const Route = createFileRoute("/admin/submissions/$id")({
  head: () => ({ meta: [{'title': 'Edit submissions | Northbeat admin'}, {'name': 'description', 'content': 'Edit submissions for Northbeat.'}, {'property': 'og:title', 'content': 'Edit submissions | Northbeat admin'}, {'property': 'og:description', 'content': 'Edit submissions for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["submissions", "one", id],
    queryFn: async () => {
      const { data, error } = await db.from("submissions").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Submission | null;
    },
  });
  const s = q.data;
  const [note, setNote] = useState("");
  const [entity, setEntity] = useState<EntityKey>("organisations");
  useEffect(() => {
    if (!s) return;
    setNote(s.admin_note ?? "");
    setEntity(approvableEntity(s) ?? "organisations");
  }, [s]);

  const review = async (patch: Record<string, unknown>) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await db.from("submissions").update({ ...patch, admin_note: note || null, reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);
  };

  const setStatus = useMutation({
    mutationFn: (status: string) => review({ status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["submissions"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!s) throw new Error("Not loaded");
      const cfg = ENTITIES[entity];
      const values = buildDraft(entity, s);
      const empty = Object.fromEntries(cfg.links.map((l) => [l.table, []]));
      let newId: string;
      try {
        newId = await saveEntry(cfg, "new", values, [], empty);
      } catch (e) {
        if (!(e as Error).message.includes("duplicate key")) throw e;
        newId = await saveEntry(cfg, "new", { ...values, slug: `${String(values[cfg.titleField])}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") }, [], empty);
      }
      await review({ status: "accepted", entry_kind: ENTITY_TO_KIND[entity], entry_id: newId });
      return newId;
    },
    onSuccess: (newId) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: [entity] });
      toast.success("Draft created");
      navigate({ to: `/admin/${entity}/$id` as never, params: { id: newId } as never });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (q.error) return <p role="alert" className="text-destructive">{(q.error as Error).message}</p>;
  if (!s) return <p>Not found.</p>;

  const linked = s.entry_kind && s.entry_id ? KIND_TO_ENTITY[s.entry_kind] : undefined;
  const busy = setStatus.isPending || approve.isPending;
  const rows: [string, React.ReactNode][] = [
    ["Type", submissionLabel(s)],
    ["Status", humanize(s.status)],
    ["Received", new Date(s.created_at).toLocaleString()],
    ["Name", s.name],
    ["Email", s.email ? <a href={`mailto:${s.email}`} className="underline">{s.email}</a> : null],
    ["Organisation", s.organisation_name],
    ["Entry kind", s.entry_kind ? humanize(s.entry_kind) : null],
    ["Related entry", linked ? <Link to={`/admin/${linked}/$id` as never} params={{ id: s.entry_id } as never} className="underline">Open entry</Link> : null],
    ["Proposed URL", s.proposed_url ? <a href={s.proposed_url} target="_blank" rel="noreferrer" className="underline break-all">{s.proposed_url}</a> : null],
    ["Consent given", s.consent_at ? new Date(s.consent_at).toLocaleString() : "No"],
    ["Reviewed", s.reviewed_at ? new Date(s.reviewed_at).toLocaleString() : null],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link to="/admin/submissions" className="text-sm text-muted-foreground hover:underline">← Submissions</Link>
        <h1 className="text-xl font-semibold text-foreground">{submissionLabel(s)} from {s.name || s.email || "anonymous"}</h1>
      </div>

      <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      {s.message && (
        <section className="space-y-1">
          <h2 className="text-base font-semibold">Message</h2>
          <p className="whitespace-pre-wrap rounded-md border border-border p-3 text-sm">{s.message}</p>
        </section>
      )}

      {s.payload && Object.keys(s.payload).length > 0 && (
        <section className="space-y-1">
          <h2 className="text-base font-semibold">Submitted data</h2>
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-2 rounded-md border border-border p-3 text-sm">
            {Object.entries(s.payload).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-muted-foreground">{humanize(k)}</dt><dd className="whitespace-pre-wrap break-words">{typeof v === "string" ? v : JSON.stringify(v)}</dd></div>
            ))}
          </dl>
        </section>
      )}

      <section className="space-y-1">
        <Label htmlFor="note">Admin note (internal)</Label>
        <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </section>

      <section className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={() => setStatus.mutate("in_review")}>Mark in review</Button>
        <Button variant="outline" disabled={busy} onClick={() => setStatus.mutate("rejected")}>Reject</Button>
        <Button variant="outline" disabled={busy} onClick={() => setStatus.mutate("done")}>Mark done</Button>
      </section>

      {approvableEntity(s) && (
        <section className="space-y-2 rounded-md border border-border p-4">
          <h2 className="text-base font-semibold">Approve as draft</h2>
          {s.status === "accepted" && linked && <p className="text-sm text-muted-foreground">Already approved — a draft was created.</p>}
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="entity">Entry type</Label>
              <select id="entity" className={selectClass} value={entity} onChange={(e) => setEntity(e.target.value as EntityKey)}>
                {(Object.keys(ENTITIES) as EntityKey[]).filter((k) => k !== "guides" && k !== "glossary").map((k) => <option key={k} value={k}>{ENTITIES[k].singular}</option>)}
              </select>
            </div>
            <Button disabled={busy} onClick={() => approve.mutate()}>{approve.isPending ? "Creating…" : "Approve → create draft"}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
