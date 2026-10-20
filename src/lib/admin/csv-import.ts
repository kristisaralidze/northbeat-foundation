import Papa from 'papaparse';
import { z } from 'zod';
import { ENTITIES, EVENT_FORMATS, slugify } from './entities';

export const importEntitySchema = z.enum(['organisations', 'events', 'opportunities']);
export type ImportEntity = z.infer<typeof importEntitySchema>;
export const CSV_COLUMNS: Record<ImportEntity, string[]> = {
  organisations: ['name', 'type', 'short_description', 'website', 'city', 'country', 'fields', 'sub_areas', 'stages', 'journey_steps', 'founded_year', 'source_url', 'contact_email'],
  events: ['title', 'event_type', 'summary', 'starts_at', 'ends_at', 'city', 'venue', 'format', 'registration_url', 'apply_deadline_at', 'fields', 'journey_steps', 'organiser', 'source_url'],
  opportunities: ['title', 'type', 'summary', 'provider', 'deadline_at', 'amount_min_eur', 'amount_max_eur', 'eligibility', 'apply_url', 'fields', 'stages', 'journey_steps', 'source_url'],
};
export const TAG_COLUMNS: Record<string, string> = { country: 'country', fields: 'field', sub_areas: 'sub_area', stages: 'stage', journey_steps: 'journey_step' };
export const normalize = (value: string) => value.trim().toLocaleLowerCase('en');
export const tagKey = (kind: string, name: string) => `${kind}:${normalize(name)}`;
export const splitTags = (value: string) => [...new Set(value.split('|').map(v => v.trim()).filter(Boolean))];
export function websiteDomain(value: string) {
  if (!value.trim()) return '';
  try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}
export type CsvRow = Record<string, string>;
export type Snapshot = { entries: { id: string; name: string; website: string | null }[]; organisations: { id: string; name: string }[]; terms: { id: string; kind: string; name: string }[] };
export type TagChoice = 'create' | 'skip';
export const importInputSchema = z.object({ entity: importEntitySchema, rows: z.array(z.object({ number: z.number().int().positive(), values: z.record(z.string().max(20000)) })).max(50), choices: z.record(z.enum(['create', 'skip'])) });

export function parseCsv(text: string) {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' });
  if (parsed.errors.length) throw new Error(`CSV error: ${parsed.errors[0]?.message}`);
  const [rawHeaders, ...rows] = parsed.data;
  const headers = rawHeaders?.map(h => h.trim()) ?? [];
  if (!headers.length || !rows.length) throw new Error('The CSV needs a header row and at least one data row.');
  if (new Set(headers.map(normalize)).size !== headers.length || headers.some(h => !h)) throw new Error('Column headers must be unique and not empty.');
  if (rows.length > 1000) throw new Error('Import up to 1,000 rows per file.');
  if (rows.some(row => row.length !== headers.length)) throw new Error('Each row must have the same number of columns as the header.');
  return { headers, rows };
}
export function autoMapping(entity: ImportEntity, headers: string[]) {
  return Object.fromEntries(CSV_COLUMNS[entity].map(col => [col, headers.find(h => normalize(h).replace(/[\s-]+/g, '_') === col) ?? '']));
}
export function mapCsvRows(entity: ImportEntity, headers: string[], rows: string[][], mapping: Record<string, string>): CsvRow[] {
  return rows.map(row => Object.fromEntries(CSV_COLUMNS[entity].map(col => [col, row[headers.indexOf(mapping[col] ?? '')]?.trim() ?? ''])));
}
export function unknownTags(entity: ImportEntity, rows: CsvRow[], snapshot: Snapshot) {
  const known = new Set(snapshot.terms.map(t => tagKey(t.kind, t.name)));
  const unknown = new Map<string, { kind: string; name: string }>();
  for (const row of rows) for (const col of CSV_COLUMNS[entity]) {
    const kind = TAG_COLUMNS[col];
    if (kind) for (const name of splitTags(row[col] ?? '')) if (!known.has(tagKey(kind, name))) unknown.set(tagKey(kind, name), { kind, name });
  }
  return [...unknown].map(([key, value]) => ({ key, ...value }));
}
export function prepareRow(entity: ImportEntity, row: CsvRow, snapshot: Snapshot, choices: Record<string, TagChoice>, today: string) {
  const cfg = ENTITIES[entity];
  const errors: string[] = [];
  const warnings: string[] = [];
  const name = row[cfg.titleField]?.trim() ?? '';
  const duplicate = snapshot.entries.some(e => normalize(e.name) === normalize(name) || (entity === 'organisations' && websiteDomain(row['website'] ?? '') !== '' && websiteDomain(e.website ?? '') === websiteDomain(row['website'] ?? '')));
  const values: Record<string, unknown> = { status: 'draft', last_checked: today, slug: slugify(name), [cfg.titleField]: name };
  if (!name) errors.push(`${cfg.titleField} is required`);
  const tags: { kind: string; name: string; create: boolean }[] = [];
  for (const column of CSV_COLUMNS[entity]) {
    const value = row[column]?.trim() ?? '';
    if (!value) continue;
    const kind = TAG_COLUMNS[column];
    if (kind) {
      for (const name of splitTags(value)) {
        const known = snapshot.terms.some(t => t.kind === kind && normalize(t.name) === normalize(name));
        const choice = choices[tagKey(kind, name)];
        if (known || choice === 'create') tags.push({ kind, name, create: !known });
        else if (choice === 'skip') warnings.push(`Skipped tag: ${name}`);
        else errors.push(`Choose create or skip for ${name}`);
      }
      continue;
    }
    if (column === 'provider' || column === 'organiser') continue;
    if (column === 'eligibility') { values['description'] = value; continue; }
    if (column === cfg.typeField || column === 'format') {
      const normalized = normalize(value).replace(/[\s-]+/g, '_');
      const options = column === 'format' ? EVENT_FORMATS : cfg.typeOptions;
      if (!options?.includes(normalized)) errors.push(`Invalid ${column}: ${value}`);
      else values[column] = normalized;
    } else if (column.endsWith('_at')) {
      if (!/^\d{4}-\d{2}-\d{2}(?:T|\s|$)/.test(value) || !Number.isFinite(Date.parse(value))) errors.push(`Invalid ${column}: use an ISO date`);
      else values[column] = new Date(value).toISOString();
    } else if (['founded_year', 'amount_min_eur', 'amount_max_eur'].includes(column)) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || (column === 'founded_year' && !Number.isInteger(number))) errors.push(`Invalid ${column}`);
      else values[column] = number;
    } else if (column === 'website' || column.endsWith('_url')) {
      const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      if (!z.string().url().safeParse(url).success || !/^https?:\/\//i.test(url)) errors.push(`Invalid ${column}`);
      else values[column] = url;
    } else if (column === 'contact_email') {
      if (!z.string().email().safeParse(value).success) errors.push('Invalid contact_email');
      else values[column] = value;
    } else values[column] = value;
  }
  if (!values[cfg.typeField ?? 'type']) errors.push(`${cfg.typeField} is required`);
  if (typeof values['amount_min_eur'] === 'number' && typeof values['amount_max_eur'] === 'number' && values['amount_min_eur'] > values['amount_max_eur']) errors.push('Minimum amount exceeds maximum amount');
  if (values['starts_at'] && values['ends_at'] && String(values['ends_at']) < String(values['starts_at'])) errors.push('End date precedes start date');
  const orgName = row[entity === 'events' ? 'organiser' : 'provider']?.trim();
  const matches = orgName ? snapshot.organisations.filter(o => normalize(o.name) === normalize(orgName)) : [];
  if (orgName && matches.length !== 1) errors.push(matches.length ? `Ambiguous organisation: ${orgName}` : `Unknown organisation: ${orgName}`);
  return { name, values, tags, organisationId: matches[0]?.id ?? null, duplicate, errors, warnings };
}