import { describe, expect, it } from 'vitest';
import { autoMapping, mapCsvRows, parseCsv, prepareRow, unknownTags, type Snapshot } from './csv-import';

const snapshot: Snapshot = { entries: [{ id: '1', name: 'Existing', website: 'https://www.existing.fi/about' }], organisations: [{ id: '2', name: 'Partner' }], terms: [{ id: '3', kind: 'field', name: 'Digital health' }] };
describe('CSV import rules', () => {
  it('parses quoted commas and newlines and auto-matches column names', () => {
    const csv = parseCsv('Name,Type,Short Description\r\nExample,startup,"A, B\nC"');
    const rows = mapCsvRows('organisations', csv.headers, csv.rows, autoMapping('organisations', csv.headers));
    expect(rows[0]?.['short_description']).toBe('A, B\nC');
    expect(rows[0]?.['name']).toBe('Example');
  });
  it('forces drafts and today regardless of supplied values', () => {
    const result = prepareRow('organisations', { name: 'New', type: 'startup', status: 'published', last_checked: '2000-01-01' }, snapshot, {}, '2026-10-20');
    expect(result.values['status']).toBe('draft');
    expect(result.values['last_checked']).toBe('2026-10-20');
    expect(result.values['published_at']).toBeUndefined();
  });
  it('skips duplicate names case-insensitively', () => {
    expect(prepareRow('organisations', { name: ' existing ', type: 'startup' }, snapshot, {}, '2026-10-20').duplicate).toBe(true);
    expect(prepareRow('events', { title: 'Existing', event_type: 'meetup' }, snapshot, {}, '2026-10-20').duplicate).toBe(true);
    expect(prepareRow('opportunities', { title: 'Existing', type: 'grant_call' }, snapshot, {}, '2026-10-20').duplicate).toBe(true);
  });
  it('skips duplicate website domains despite protocols and paths', () => {
    expect(prepareRow('organisations', { name: 'Other', type: 'startup', website: 'http://existing.fi/new' }, snapshot, {}, '2026-10-20').duplicate).toBe(true);
  });
  it('matches pipe-separated existing tags by kind and name', () => {
    const result = prepareRow('organisations', { name: 'New', type: 'startup', fields: 'digital health | Digital health' }, snapshot, {}, '2026-10-20');
    expect(result.tags.every(t => t.kind === 'field' && !t.create)).toBe(true);
    expect(result.errors).toEqual([]);
  });
  it('lists unknown tags and requires an explicit create or skip choice', () => {
    const row = { name: 'New', type: 'startup', fields: 'Digital health|Novel', journey_steps: 'Growth' };
    expect(unknownTags('organisations', [row], snapshot).map(t => t.key)).toEqual(['field:novel', 'journey_step:growth']);
    expect(prepareRow('organisations', row, snapshot, {}, '2026-10-20').errors).toHaveLength(2);
    const result = prepareRow('organisations', row, snapshot, { 'field:novel': 'create', 'journey_step:growth': 'skip' }, '2026-10-20');
    expect(result.tags).toContainEqual({ kind: 'field', name: 'Novel', create: true });
    expect(result.tags.some(t => t.kind === 'journey_step')).toBe(false);
  });
  it('matches organiser and provider to organisation IDs', () => {
    expect(prepareRow('events', { title: 'Meetup', event_type: 'meetup', organiser: 'partner' }, snapshot, {}, '2026-10-20').organisationId).toBe('2');
    expect(prepareRow('opportunities', { title: 'Call', type: 'grant_call', provider: 'Partner' }, snapshot, {}, '2026-10-20').organisationId).toBe('2');
  });
  it('rejects unknown or ambiguous organisation matches', () => {
    expect(prepareRow('events', { title: 'Meetup', event_type: 'meetup', organiser: 'Missing' }, snapshot, {}, '2026-10-20').errors).toContain('Unknown organisation: Missing');
  });
  it('preserves eligibility as description and validates numbers and ISO dates', () => {
    const result = prepareRow('opportunities', { title: 'Call', type: 'grant_call', eligibility: 'Nordic ventures\nAt least two founders', amount_min_eur: '1000', amount_max_eur: '5000', deadline_at: '2026-11-01' }, snapshot, {}, '2026-10-20');
    expect(result.values['description']).toBe('Nordic ventures\nAt least two founders');
    expect(result.values['amount_min_eur']).toBe(1000);
    expect(result.values['deadline_at']).toBe('2026-11-01T00:00:00.000Z');
    expect(result.errors).toEqual([]);
  });
});