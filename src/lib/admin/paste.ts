import { z } from 'zod';
import { ENTITIES, EVENT_FORMATS, type EntityKey } from './entities';
import type { ImportEntity } from './csv-import';

/**
 * Paste data columns per entity: the file-import columns that make sense for updates,
 * plus slug (the match key) and the rich profile fields. Tag columns and provider/organiser
 * are not supported in paste; empty cells never clear existing values.
 */
export const PASTE_COLUMNS: Record<ImportEntity, string[]> = {
  organisations: ['slug', 'name', 'type', 'short_description', 'description', 'website', 'city', 'founded_year', 'story', 'our_take', 'offer_chips', 'how_to_get_involved', 'scale_facts', 'sources', 'source_url', 'contact_email', 'linkedin_url'],
  events: ['slug', 'title', 'event_type', 'summary', 'description', 'starts_at', 'ends_at', 'city', 'venue', 'format', 'registration_url', 'apply_deadline_at', 'story', 'our_take', 'scale_facts', 'who_youll_meet', 'price_info', 'free_ways_in', 'tips', 'source_url'],
  opportunities: ['slug', 'title', 'type', 'summary', 'description', 'deadline_at', 'amount_min_eur', 'amount_max_eur', 'apply_url', 'who_can_apply', 'what_you_get', 'how_to_apply_steps', 'tips', 'source_url'],
};
const LIST_COLUMNS = new Set(['offer_chips', 'how_to_get_involved', 'who_youll_meet', 'tips', 'who_can_apply', 'how_to_apply_steps']);
const NUMBER_COLUMNS = new Set(['founded_year', 'amount_min_eur', 'amount_max_eur']);

export const pasteInputSchema = z.object({
  entity: z.enum(['organisations', 'events', 'opportunities']),
  rows: z.array(z.object({ number: z.number().int().positive(), values: z.record(z.string().max(20000)) })).min(1).max(200),
});

export type PasteChange = { column: string; old: string; value: string | number | string[] | Record<string, string>[] };
export type PastePreview = { number: number; slug: string; name: string; id: string | null; changes: PasteChange[]; errors: string[] };

/** Parse one pasted cell into a typed value. Empty cells return null and are never applied. */
export function parsePasteValue(entity: ImportEntity, column: string, raw: string): { value?: string | number | string[] | Record<string, string>[]; error?: string } {
  const value = raw.trim();
  if (!value) return {};
  const cfg = ENTITIES[entity as EntityKey];
  if (LIST_COLUMNS.has(column)) return { value: [...new Set(value.split('|').map(v => v.trim()).filter(Boolean))] };
  if (column === 'scale_facts') {
    const facts = value.split(';').map(entry => entry.split('|').map(p => p.trim()));
    if (facts.some(f => f.length < 2 || !f[0] || !f[1])) return { error: 'scale_facts: use value | label | year | source, entries separated by ;' };
    return { value: facts.map(f => ({ value: f[0]!, label: f[1]!, ...(f[2] ? { year: f[2] } : {}), ...(f[3] ? { source_url: f[3] } : {}) })) };
  }
  if (column === 'sources') {
    const urls = value.split(';').map(u => u.trim()).filter(Boolean).map(u => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
    if (urls.some(u => !z.string().url().safeParse(u).success)) return { error: 'sources: every entry must be a URL, separated by ;' };
    return { value: urls };
  }
  if (column === cfg.typeField || column === 'format') {
    const normalized = value.toLowerCase().replace(/[\s-]+/g, '_');
    const options = column === 'format' ? EVENT_FORMATS : cfg.typeOptions;
    return options?.includes(normalized) ? { value: normalized } : { error: `Invalid ${column}: ${value}` };
  }
  if (column.endsWith('_at')) {
    if (!/^\d{4}-\d{2}-\d{2}(?:T|\s|$)/.test(value) || !Number.isFinite(Date.parse(value))) return { error: `Invalid ${column}: use an ISO date` };
    return { value: new Date(value).toISOString() };
  }
  if (NUMBER_COLUMNS.has(column)) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || (column === 'founded_year' && !Number.isInteger(number))) return { error: `Invalid ${column}` };
    return { value: number };
  }
  if (column === 'website' || column.endsWith('_url')) {
    const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return z.string().url().safeParse(url).success && /^https?:\/\//i.test(url) ? { value: url } : { error: `Invalid ${column}` };
  }
  if (column === 'contact_email') return z.string().email().safeParse(value).success ? { value } : { error: 'Invalid contact_email' };
  return { value };
}

/** Display form of a stored value for the preview's "old" column. */
export function displayOld(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (Array.isArray(value)) return value.map(v => (typeof v === 'object' && v ? Object.values(v as Record<string, unknown>).filter(Boolean).join(' | ') : String(v))).join('; ') || '(empty)';
  return String(value);
}
