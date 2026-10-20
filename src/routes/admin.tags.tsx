import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, listTerms, type Term } from "@/lib/admin/db";
import { slugify } from "@/lib/admin/entities";
import { selectClass } from "@/components/admin/EntityList";

export const Route = createFileRoute("/admin/tags")({
  head: () => ({ meta: [{'title': 'Tags | Northbeat admin'}, {'name': 'description', 'content': 'Tags for Northbeat.'}, {'property': 'og:title', 'content': 'Tags | Northbeat admin'}, {'property': 'og:description', 'content': 'Tags for Northbeat.'}, {'property': 'og:type', 'content': 'website'}, {'name': 'twitter:card', 'content': 'summary'}] }),
  component: TagsPage,
});

const KINDS = [
  { kind: "field", label: "Fields" },
  { kind: "sub_area", label: "Sub-areas" },
  { kind: "country", label: "Countries" },
  { kind: "stage", label: "Stages" },
  { kind: "area", label: "Areas" },
  { kind: "journey_step", label: "Journey steps" },
] as const;

function err(e: { message: string } | null) {
  if (e) throw new Error(e.message.includes("duplicate key") ? "A tag with that name already exists." : e.message);
}

function TagsPage() {
  const qc = useQueryClient();
  const terms = useQuery({ queryKey: ["terms"], queryFn: listTerms });
  const all = terms.data ?? [];
  const fields = all.filter((t) => t.kind === "field");

  const run = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["terms"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-xl font-semibold text-foreground">Tags</h1>
      {terms.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {KINDS.map(({ kind, label }) => (
        <TermSection
          key={kind}
          kind={kind}
          label={label}
          items={all.filter((t) => t.kind === kind)}
          fields={fields}
          run={(fn) => run.mutate(fn)}
          busy={run.isPending}
        />
      ))}
    </div>
  );
}

function TermSection({
  kind, label, items, fields, run, busy,
}: {
  kind: string; label: string; items: Term[]; fields: Term[];
  run: (fn: () => Promise<void>) => void; busy: boolean;
}) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const isSub = kind === "sub_area";

  const add = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (isSub && !parent) { toast.error("Choose a parent field first."); return; }
    run(async () => {
      const sort = items.reduce((m, t) => Math.max(m, t.sort_order), 0) + 1;
      const { error } = await db.from("terms").insert({ kind, name: n, slug: slugify(n), parent_id: isSub ? parent : null, sort_order: sort });
      err(error);
      setName("");
    });
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const reordered = [...items];
    const a = reordered[i]!;
    reordered[i] = reordered[j]!;
    reordered[j] = a;
    run(async () => {
      for (const [idx, t] of reordered.entries()) {
        const { error } = await db.from("terms").update({ sort_order: idx + 1 }).eq("id", t.id);
        err(error);
      }
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{label}</h2>
      {items.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
      <ul className="divide-y rounded-md border">
        {items.map((t, i) => (
          <TermRow
            key={t.id}
            term={t}
            fields={isSub ? fields : null}
            first={i === 0}
            last={i === items.length - 1}
            busy={busy}
            onMove={(d) => move(i, d)}
            run={run}
          />
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-wrap gap-2">
        <Input aria-label={`New ${label.toLowerCase()} name`} placeholder={`Add to ${label.toLowerCase()}…`} value={name} onChange={(e) => setName(e.target.value)} className="w-64" />
        {isSub && (
          <select aria-label="Parent field" className={selectClass} value={parent} onChange={(e) => setParent(e.target.value)} required>
            <option value="">Parent field…</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
        <Button type="submit" disabled={busy}>Add</Button>
      </form>
    </section>
  );
}

function TermRow({
  term, fields, first, last, busy, onMove, run,
}: {
  term: Term; fields: Term[] | null; first: boolean; last: boolean; busy: boolean;
  onMove: (d: -1 | 1) => void; run: (fn: () => Promise<void>) => void;
}) {
  const [name, setName] = useState(term.name);
  const changed = name.trim() !== term.name;

  const rename = () =>
    run(async () => {
      const n = name.trim();
      if (!n) return;
      const { error } = await db.from("terms").update({ name: n, slug: slugify(n) }).eq("id", term.id);
      err(error);
      toast.success("Renamed");
    });

  const setParent = (pid: string) =>
    run(async () => {
      const { error } = await db.from("terms").update({ parent_id: pid }).eq("id", term.id);
      err(error);
    });

  const remove = () => {
    const extra = term.kind === "field" ? " Its sub-areas will be deleted too." : "";
    if (!confirm(`Delete "${term.name}"? It will be removed from every entry that uses it.${extra}`)) return;
    run(async () => {
      const { error } = await db.from("terms").delete().eq("id", term.id);
      err(error);
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-2 p-2">
      <div className="flex flex-col">
        <button type="button" aria-label={`Move ${term.name} up`} disabled={first || busy} onClick={() => onMove(-1)} className="px-1 text-xs text-muted-foreground disabled:opacity-30">▲</button>
        <button type="button" aria-label={`Move ${term.name} down`} disabled={last || busy} onClick={() => onMove(1)} className="px-1 text-xs text-muted-foreground disabled:opacity-30">▼</button>
      </div>
      <Input
        aria-label={`Name of ${term.name}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && changed) { e.preventDefault(); rename(); } }}
        className="w-56"
      />
      {changed && <Button size="sm" onClick={rename} disabled={busy}>Save</Button>}
      {fields && (
        <select aria-label={`Parent field of ${term.name}`} className={selectClass} value={term.parent_id ?? ""} onChange={(e) => setParent(e.target.value)}>
          {!term.parent_id && <option value="">Choose parent…</option>}
          {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      )}
      <Button size="sm" variant="ghost" className="ml-auto" onClick={remove} disabled={busy}>Delete</Button>
    </li>
  );
}
