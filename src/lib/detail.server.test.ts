import { expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { detailContext } from './detail.server';

it('reads link tables by their real composite keys and excludes drafts from recommendations', async () => {
  const orders: Record<string, string[]> = {}; const filters: Record<string, [string, string][]> = {};
  const records: Record<string, Record<string, unknown>[]> = {
    events: [], opportunities: [],
    organisations: [
      { id: 'published', slug: 'published', name: 'Published', status: 'published', city: 'Helsinki' },
      { id: 'draft', slug: 'draft', name: 'Draft', status: 'draft', city: 'Helsinki' },
    ],
    organisation_terms: [{ organisation_id: 'published', term_id: 'med' }, { organisation_id: 'draft', term_id: 'med' }],
  };
  const client = { from(table: string) {
    filters[table] = []; orders[table] = [];
    const chain = {
      select() { return chain; }, order(key: string) { orders[table]?.push(key); return chain; },
      eq(key: string, value: string) { filters[table]?.push([key, value]); return chain; },
      range() { return chain; },
      then(resolve: (value: unknown) => unknown) { return Promise.resolve({ error: null, data: (records[table] ?? []).filter(row => filters[table]?.every(([key, value]) => row[key] === value)) }).then(resolve); },
    }; return chain;
  } } as unknown as SupabaseClient;
  const result = await detailContext(client, 'organisations', { id: 'self', slug: 'self', city: 'Helsinki' }, [{ id: 'med', name: 'Medtech', slug: 'medtech', kind: 'field' }], []);
  expect(orders['organisation_terms']).toEqual(['organisation_id', 'term_id']);
  expect(filters['organisations']).toContainEqual(['status', 'published']);
  expect(result.similar.map(row => row.id)).toEqual(['published']);
});