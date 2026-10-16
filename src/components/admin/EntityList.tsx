import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTITIES, STATUS, humanize, type EntityKey } from "@/lib/admin/entities";
import { listEntries, listTerms, type ListFilters } from "@/lib/admin/db";

export const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function EntityList({ entity, filters }: { entity: EntityKey; filters: ListFilters }) {
  const cfg = ENTITIES[entity];
  const navigate = useNavigate();
  const [q, setQ] = useState(filters.q ?? "");

  const setFilter = (patch: Partial<ListFilters>) =>
    navigate({ to: ".", search: (prev: ListFilters) => ({ ...prev, ...patch }) as never, replace: true });

  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== q) setFilter({ q: q || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const terms = useQuery({ queryKey: ["terms"], queryFn: listTerms });
  const rows = useQuery({ queryKey: [entity, "list", filters], queryFn: () => listEntries(cfg, filters) });
  const fields = (terms.data ?? []).filter((t) => t.kind === "field");
  const countries = (terms.data ?? []).filter((t) => t.kind === "country");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{cfg.plural}</h1>
        <Button asChild>
          <Link to={`/admin/${entity}/$id` as never} params={{ id: "new" } as never}>New {cfg.singular.toLowerCase()}</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input aria-label="Search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
        {cfg.typeOptions && (
          <select aria-label="Type" className={selectClass} value={filters.type ?? ""} onChange={(e) => setFilter({ type: e.target.value || undefined })}>
            <option value="">All types</option>
            {cfg.typeOptions.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
          </select>
        )}
        <select aria-label="Field" className={selectClass} value={filters.field ?? ""} onChange={(e) => setFilter({ field: e.target.value || undefined })}>
          <option value="">All fields</option>
          {fields.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select aria-label="Country" className={selectClass} value={filters.country ?? ""} onChange={(e) => setFilter({ country: e.target.value || undefined })}>
          <option value="">All countries</option>
          {countries.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select aria-label="Status" className={selectClass} value={filters.status ?? ""} onChange={(e) => setFilter({ status: e.target.value || undefined })}>
          <option value="">All statuses</option>
          {STATUS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </div>

      {rows.error && <p role="alert" className="text-sm text-destructive">{(rows.error as Error).message}</p>}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {cfg.typeField && <TableHead>Type</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Last checked</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.isLoading && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {rows.data?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-muted-foreground">Nothing here yet.</TableCell></TableRow>
            )}
            {rows.data?.map((r) => (
              <TableRow key={r["id"]}>
                <TableCell>
                  <Link to={`/admin/${entity}/$id` as never} params={{ id: r["id"] } as never} className="font-medium text-foreground underline-offset-2 hover:underline">
                    {String(r[cfg.titleField] ?? "(untitled)")}
                  </Link>
                </TableCell>
                {cfg.typeField && <TableCell>{humanize(String(r[cfg.typeField] ?? ""))}</TableCell>}
                <TableCell>{humanize(String(r["status"]))}</TableCell>
                <TableCell>{(r["last_checked"] as string) ?? "—"}</TableCell>
                <TableCell>{new Date(String(r["updated_at"])).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
