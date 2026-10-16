import { ENTITIES, type EntityKey } from "./entities";

export const SUBMISSION_TYPES = ["new_entry", "correction", "contact", "podcast_guest"] as const;
export const SUBMISSION_STATUSES = ["new", "in_review", "accepted", "rejected", "done"] as const;

export type Submission = {
  id: string;
  type: string;
  status: string;
  name: string | null;
  email: string | null;
  organisation_name: string | null;
  entry_kind: string | null;
  entry_id: string | null;
  proposed_url: string | null;
  message: string | null;
  payload: Record<string, unknown>;
  consent_at: string | null;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
};

/** entry_kind values that can become a draft in the admin. */
export const KIND_TO_ENTITY: Partial<Record<string, EntityKey>> = {
  organisation: "organisations",
  person: "people",
  event: "events",
  opportunity: "opportunities",
  episode: "episodes",
};
export const ENTITY_TO_KIND: Record<EntityKey, string> = {
  organisations: "organisation",
  people: "person",
  events: "event",
  opportunities: "opportunity",
  episodes: "episode",
};

/** Guess which entry type a submission describes. */
export function guessEntity(s: Pick<Submission, "entry_kind" | "payload">): EntityKey | null {
  const k = s.entry_kind ?? (typeof s.payload?.["entry_kind"] === "string" ? String(s.payload["entry_kind"]) : null)
    ?? (typeof s.payload?.["kind"] === "string" ? String(s.payload["kind"]) : null);
  return (k && KIND_TO_ENTITY[k]) || null;
}

/** Map a submission onto draft field values for the given entity. */
export function buildDraft(entity: EntityKey, s: Pick<Submission, "name" | "organisation_name" | "proposed_url" | "message" | "payload">): Record<string, unknown> {
  const cfg = ENTITIES[entity];
  const p = s.payload ?? {};
  const out: Record<string, unknown> = { status: "draft" };

  for (const f of cfg.fields) {
    const v = p[f.name];
    if (v === undefined || v === null || v === "") continue;
    if (f.kind === "select" && f.options && !f.options.includes(String(v))) continue;
    if (f.kind === "multi") {
      if (Array.isArray(v)) out[f.name] = v.filter((x) => f.options?.includes(String(x)));
      continue;
    }
    if (f.kind === "number") {
      const n = Number(v);
      if (Number.isFinite(n)) out[f.name] = n;
      continue;
    }
    if (f.kind === "boolean") { out[f.name] = Boolean(v); continue; }
    out[f.name] = typeof v === "string" ? v : String(v);
  }

  // Title fallback: payload title/name, then organisation name (for orgs), then submitter-provided names.
  if (!out[cfg.titleField]) {
    const t = p["title"] ?? p["name"] ?? (entity === "organisations" ? s.organisation_name : null) ?? (entity === "people" ? s.name : null);
    out[cfg.titleField] = t ? String(t) : "Untitled submission";
  }

  // Required type selects need a valid value.
  for (const f of cfg.fields) {
    if (f.kind === "select" && f.required && !out[f.name] && f.options?.[0]) out[f.name] = f.options[0];
  }

  if (s.proposed_url) {
    out["source_url"] = s.proposed_url;
    if (entity === "organisations" && !out["website"]) out["website"] = s.proposed_url;
  }
  return out;
}
