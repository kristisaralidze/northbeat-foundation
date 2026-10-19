import type { EntityKey } from './admin/entities';
export type ProfileRow = Record<string, string | number | boolean | string[] | null> & { id: string; slug: string };
export type ProfileTerm = { id: string; name: string; kind: string; slug: string };
export type RelatedEntry = { id: string; slug: string; title: string; summary: string | null; image: string | null; roles: string[] };
export type RelatedGroup = { kind: EntityKey; label: string; entries: RelatedEntry[] };
export type PublicProfile = { kind: EntityKey; row: ProfileRow; title: string; summary: string | null; image: string | null; terms: ProfileTerm[]; related: RelatedGroup[] };
export const text = (row: Record<string, unknown>, key: string): string | null => typeof row[key] === 'string' && row[key] ? String(row[key]) : null;
export function safeWebUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function publicEntry(kind: EntityKey, row: ProfileRow): RelatedEntry {
  return { id: row.id, slug: row.slug, title: text(row, kind === 'organisations' ? 'name' : kind === 'people' ? 'full_name' : 'title') ?? '', summary: text(row, kind === 'organisations' ? 'short_description' : kind === 'people' ? 'headline' : 'summary'), image: safeWebUrl(text(row, kind === 'organisations' ? 'logo_url' : kind === 'people' ? 'photo_url' : 'cover_url')), roles: [] };
}
export function publishedOnly(rows: (ProfileRow & { status?: unknown })[]): ProfileRow[] { return rows.filter((row) => row.status === 'published'); }
