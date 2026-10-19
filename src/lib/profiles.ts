import type { EntityKey } from './admin/entities';
export type ProfileRow = Record<string, string | number | boolean | string[] | null> & { id: string; slug: string };
export type ProfileTerm = { id: string; name: string; kind: string; slug: string };
export type RelatedEntry = { id: string; slug: string; title: string; summary: string | null; image: string | null; roles: string[]; type?: string | undefined };
export type RelatedGroup = { kind: EntityKey; label: string; entries: RelatedEntry[] };
export type PublicProfile = { kind: EntityKey; row: ProfileRow; title: string; summary: string | null; image: string | null; terms: ProfileTerm[]; related: RelatedGroup[] };
/** Presentation only: leave stored entry titles unchanged. */
export const publicTitle = (value: string): string => value.replace(/\s*[—–]\s*/g, ': ');
export const text = (row: Record<string, unknown>, key: string): string | null => typeof row[key] === 'string' && row[key] ? String(row[key]) : null;
export function safeWebUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function publicEntry(kind: EntityKey, row: ProfileRow): RelatedEntry {
  return { id: row.id, slug: row.slug, title: publicTitle(text(row, kind === 'organisations' ? 'name' : kind === 'people' ? 'full_name' : 'title') ?? ''), summary: text(row, kind === 'organisations' ? 'short_description' : kind === 'people' ? 'headline' : 'summary'), image: safeWebUrl(text(row, kind === 'organisations' ? 'logo_url' : kind === 'people' ? 'photo_url' : 'cover_url')), roles: [], type: text(row, kind === 'events' ? 'event_type' : 'type') ?? undefined };
}
export function publishedOnly(rows: (ProfileRow & { status?: unknown })[]): ProfileRow[] { return rows.filter((row) => row.status === 'published'); }

/** Plain-language section labels for organisation relationships, by direction. */
export const ORG_RELATION_LABELS: Record<string, { outgoing: string; incoming: string }> = {
  invested_in: { outgoing: 'Portfolio', incoming: 'Backed by' },
  spun_out_of: { outgoing: 'Spun out of', incoming: 'Spinouts' },
  acquired: { outgoing: 'Acquired', incoming: 'Acquired by' },
  partner_of: { outgoing: 'Partners', incoming: 'Partners' },
};
export const ORG_RELATION_ORDER = ['Backed by', 'Portfolio', 'Spun out of', 'Spinouts', 'Acquired by', 'Acquired', 'Partners'];
export function orgRelationLabel(relation: string, direction: 'outgoing' | 'incoming'): string {
  return ORG_RELATION_LABELS[relation]?.[direction] ?? 'Related organisations';
}
