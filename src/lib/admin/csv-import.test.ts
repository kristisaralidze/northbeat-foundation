import { describe, expect, it } from 'vitest';
import { autoMapping, mapCsvRows, parseCsv, prepareRow, unknownTags, type Snapshot } from './csv-import';

const snapshot: Snapshot = { entries: [{ id: '1', slug: 'existing', name: 'Existing', website: 'https://www.existing.fi/about' }], organisations: [{ id: '2', name: 'Partner' }], terms: [{ id: '3', kind: 'field', name: 'Digital health' }] };
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
  it('requires a real parent field when creating a sub-area', () => {
    const row = { name: 'New', type: 'startup', sub_areas: 'New sub-area' };
    const choices = { 'sub_area:new sub-area': 'create' as const };
    expect(prepareRow('organisations', row, snapshot, choices, '2026-10-20').errors).toContain('Choose a parent field for New sub-area');
    const result = prepareRow('organisations', row, snapshot, choices, '2026-10-20', { 'sub_area:new sub-area': '3' });
    expect(result.tags).toContainEqual({ kind: 'sub_area', name: 'New sub-area', create: true, parent_id: '3' });
    expect(result.errors).toEqual([]);
  });
  it('rejects impossible calendar dates rather than rolling into the next month', () => {
    expect(prepareRow('events', { title: 'Meetup', event_type: 'meetup', starts_at: '2026-02-30' }, snapshot, {}, '2026-10-20').errors).toContain('Invalid starts_at: use an ISO date');
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
describe('organisation rich profile updates by slug', () => {
  it('updates only the provided rich fields on a slug match', () => {
    const result = prepareRow('organisations', { slug: 'existing', story: 'A long story.', our_take: 'Worth watching.' }, snapshot, {}, '2026-10-20');
    expect(result.duplicate).toBe(false);
    expect(result.update?.id).toBe('1');
    expect(result.update?.values).toEqual({ story: 'A long story.', our_take: 'Worth watching.' });
  });
  it('never overwrites with empty cells', () => {
    const result = prepareRow('organisations', { slug: 'existing', story: '', our_take: 'New take.' }, snapshot, {}, '2026-10-20');
    expect(result.update?.values).toEqual({ our_take: 'New take.' });
  });
  it('skips a slug match with no rich values as a duplicate', () => {
    const result = prepareRow('organisations', { slug: 'existing', name: 'Existing' }, snapshot, {}, '2026-10-20');
    expect(result.duplicate).toBe(true);
    expect(result.update).toBeUndefined();
  });
  it('parses scale_facts, chips, steps and sources into typed values', () => {
    const result = prepareRow('organisations', {
      slug: 'existing',
      scale_facts: '1,500+ | participants | 2025 | https://example.com/a; 12 | cities',
      offer_chips: 'Workspace | Coaching',
      how_to_get_involved: 'Apply online | Visit the hub',
      sources: 'https://example.com/a; example.com/b',
      founded_year: '2015',
    }, snapshot, {}, '2026-10-20');
    expect(result.errors).toEqual([]);
    expect(result.update?.values).toEqual({
      scale_facts: [{ value: '1,500+', label: 'participants', year: '2025', source_url: 'https://example.com/a' }, { value: '12', label: 'cities' }],
      offer_chips: ['Workspace', 'Coaching'],
      how_to_get_involved: ['Apply online', 'Visit the hub'],
      sources: ['https://example.com/a', 'https://example.com/b'],
      founded_year: 2015,
    });
  });
  it('reports invalid rich values without updating', () => {
    const result = prepareRow('organisations', { slug: 'existing', scale_facts: 'no label', founded_year: 'abc' }, snapshot, {}, '2026-10-20');
    expect(result.errors).toHaveLength(2);
    expect(result.update?.values['founded_year']).toBeUndefined();
  });
  it('uses the provided slug for new organisations and parses rich fields', () => {
    const result = prepareRow('organisations', { slug: 'new-org', name: 'New Org', type: 'startup', offer_chips: 'Mentoring' }, snapshot, {}, '2026-10-20');
    expect(result.update).toBeUndefined();
    expect(result.values['slug']).toBe('new-org');
    expect(result.values['offer_chips']).toEqual(['Mentoring']);
  });
});
