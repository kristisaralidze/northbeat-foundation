import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ENTITIES, slugify, type EntityConfig, type EntityKey } from "./entities";

// Untyped handle: admin screens are config-driven across many tables.
export const db = supabase as unknown as SupabaseClient;

export type Row = Record<string, unknown> & { id: string };
type Rec = Record<string, string>;
const recs = (d: unknown) => (d ?? []) as Rec[];
export type Term = { id: string; kind: string; name: string; parent_id: string | null; sort_order: number };
export type LinkRow = { otherId: string; role: string; note?: string | null };

export type ListFilters = { q?: string | undefined; type?: string | undefined; status?: string | undefined; field?: string | undefined; country?: string | undefined };

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listTerms(): Promise<Term[]> {
  const { data, error } = await db.from("terms").select("id, kind, name, parent_id, sort_order").order("sort_order").order("name");
  fail(error);
  return (data ?? []) as Term[];
}

async function idsWithTerm(cfg: EntityConfig, termId: string): Promise<string[]> {
  const { data, error } = await db.from(cfg.termTable).select(cfg.termFk).eq("term_id", termId);
  fail(error);
  return recs(data).map((r) => String(r[cfg.termFk]));
}

export async function listEntries(cfg: EntityConfig, f: ListFilters): Promise<Row[]> {
  const cols = ["id", "slug", "status", "last_checked", "updated_at", cfg.titleField, cfg.typeField].filter(Boolean).join(", ");
  let query = db.from(cfg.table).select(cols).order("updated_at", { ascending: false }).limit(500);
  if (f.q) query = query.ilike(cfg.titleField, `%${f.q}%`);
  if (f.status) query = query.eq("status", f.status);
  if (f.type && cfg.typeField) query = query.eq(cfg.typeField, f.type);
  for (const termId of [f.field, f.country]) {
    if (!termId) continue;
    const ids = await idsWithTerm(cfg, termId);
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }
  const { data, error } = await query;
  fail(error);
  return (data ?? []) as unknown as Row[];
}

export async function listOptions(key: EntityKey): Promise<{ id: string; label: string }[]> {
  const cfg = ENTITIES[key];
  const { data, error } = await db.from(cfg.table).select(`id, ${cfg.titleField}`).order(cfg.titleField).limit(2000);
  fail(error);
  return recs(data).map((r) => ({ id: String(r["id"]), label: String(r[cfg.titleField] ?? "") }));
}

export type IncomingRelation = { id: string; fromName: string; relation: string; note: string | null };

/** Relationships where this organisation is the target (read-only on the edit page). */
export async function listIncomingRelations(orgId: string): Promise<IncomingRelation[]> {
  const { data, error } = await db.from("organisation_relations").select("id, from_org_id, relation, note").eq("to_org_id", orgId).order("id").limit(1000);
  fail(error);
  const rows = recs(data);
  const fromIds = [...new Set(rows.map((r) => String(r["from_org_id"])))];
  if (!fromIds.length) return [];
  const { data: orgs, error: orgError } = await db.from("organisations").select("id, name").in("id", fromIds);
  fail(orgError);
  const names = new Map(recs(orgs).map((o) => [String(o["id"]), String(o["name"] ?? "")]));
  return rows.map((r) => ({ id: String(r["id"]), fromName: names.get(String(r["from_org_id"])) ?? "Unknown", relation: String(r["relation"] ?? ""), note: (r["note"] as string | null) ?? null }));
}

export type EntryBundle = { row: Row | null; termIds: string[]; links: Record<string, LinkRow[]> };

export async function getEntry(cfg: EntityConfig, id: string): Promise<EntryBundle> {
  if (id === "new") return { row: null, termIds: [], links: Object.fromEntries(cfg.links.map((l) => [l.table, []])) };
  const { data: row, error } = await db.from(cfg.table).select("*").eq("id", id).maybeSingle();
  fail(error);
  const { data: terms, error: tErr } = await db.from(cfg.termTable).select("term_id").eq(cfg.termFk, id);
  fail(tErr);
  const links: Record<string, LinkRow[]> = {};
  for (const l of cfg.links) {
    const rc = l.roleColumn ?? "role";
    const cols = l.roleColumn ? `${l.otherFk}, ${rc}, note` : `${l.otherFk}, ${rc}`;
    const { data, error: lErr } = await db.from(l.table).select(cols).eq(l.selfFk, id);
    fail(lErr);
    links[l.table] = recs(data).map((r) => ({ otherId: String(r[l.otherFk]), role: r[rc] ?? "", ...(l.roleColumn ? { note: r["note"] ?? null } : {}) }));
  }
  return { row: row as Row | null, termIds: (terms ?? []).map((t: { term_id: string }) => t.term_id), links };
}

export async function saveEntry(
  cfg: EntityConfig,
  id: string,
  values: Record<string, unknown>,
  termIds: string[],
  links: Record<string, LinkRow[]>,
): Promise<string> {
  const payload: Record<string, unknown> = { ...values };
  if (!payload["slug"]) payload["slug"] = slugify(String(payload[cfg.titleField] ?? ""));
  if (payload["status"] === "published" && !payload["published_at"]) payload["published_at"] = new Date().toISOString();

  let entryId = id;
  if (id === "new") {
    const { data: u } = await supabase.auth.getUser();
    payload["created_by"] = u.user?.id ?? null;
    const { data, error } = await db.from(cfg.table).insert(payload).select("id").single();
    fail(error);
    entryId = (data as { id: string }).id;
  } else {
    const { error } = await db.from(cfg.table).update(payload).eq("id", id);
    fail(error);
  }

  const { error: dErr } = await db.from(cfg.termTable).delete().eq(cfg.termFk, entryId);
  fail(dErr);
  if (termIds.length) {
    const { error } = await db.from(cfg.termTable).insert(termIds.map((t) => ({ [cfg.termFk]: entryId, term_id: t })));
    fail(error);
  }

  for (const l of cfg.links) {
    const { error: delErr } = await db.from(l.table).delete().eq(l.selfFk, entryId);
    fail(delErr);
    const seen = new Set<string>();
    const rows = (links[l.table] ?? [])
      .filter((r) => r.otherId && !seen.has(`${r.otherId}|${r.role}`) && seen.add(`${r.otherId}|${r.role}`))
      .filter((r) => !l.roleOptions || l.roleOptions.includes(r.role))
      .map((r) => ({
        [l.selfFk]: entryId, [l.otherFk]: r.otherId, [l.roleColumn ?? "role"]: r.role.trim(),
        ...(l.roleColumn ? { note: r.note ?? null } : {}),
      }));
    if (rows.length) {
      const { error } = await db.from(l.table).insert(rows);
      fail(error);
    }
  }
  return entryId;
}

export async function deleteEntry(cfg: EntityConfig, id: string) {
  const { error } = await db.from(cfg.table).delete().eq("id", id);
  fail(error);
}
