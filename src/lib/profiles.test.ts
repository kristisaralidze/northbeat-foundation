import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadPublicProfile } from './profiles.server';
import { safeWebUrl } from './profiles';
function fixture() {
  const tables: Record<string, Record<string, unknown>[]> = {
    organisations: [{ id: 'org-1', slug: 'public-org', name: 'Public org', status: 'published', contact_email: 'private@example.org', contact_email_public: false }],
    people: [{ id: 'person-1', slug: 'public-person', full_name: 'Public person', status: 'published', contact_email: 'public@example.org', contact_email_public: true }, { id: 'person-2', slug: 'draft-person', full_name: 'Draft person', status: 'draft' }],
    organisation_people: [{ id: 'link-1', organisation_id: 'org-1', person_id: 'person-1', role: 'founder' }, { id: 'link-2', organisation_id: 'org-1', person_id: 'person-2', role: 'advisor' }],
    organisation_events: [{ id: 'link-3', organisation_id: 'org-1', event_id: 'event-1', role: 'organiser' }, { id: 'link-4', organisation_id: 'org-1', event_id: 'event-2', role: 'organiser' }],
    events: [{ id: 'event-1', slug: 'public-event', title: 'Public event', status: 'published' }, { id: 'event-2', slug: 'draft-event', title: 'Draft event', status: 'draft' }],
  };
  const calls: string[] = [];
  const query = (source: Record<string, unknown>[]) => {
    let rows = source;
    const q = {
      select: (_columns: string) => q,
      eq: (key: string, value: unknown) => { rows = rows.filter((row) => row[key] === value); return q; },
      in: (key: string, values: unknown[]) => { rows = rows.filter((row) => values.includes(row[key])); return q; },
      order: (_key: string) => q,
      range: (start: number, end: number) => { rows = rows.slice(start, end + 1); return q; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: rows, error: null })),
    }; return q;
  };
  const client = {
    from: (name: string) => { calls.push(name); return query(tables[name] ?? []); },
    rpc: (name: string) => { calls.push(name); return query((tables[name.replace('public_', '')] ?? []).filter((row) => row['status'] === 'published').map((row) => ({ ...row, contact_email: row['contact_email_public'] ? row['contact_email'] : null }))); },
  } as unknown as SupabaseClient;
  return { client, calls };
}
describe('public profiles', () => {
  it('reads organisation contact through the masking RPC, never the base table', async () => {
    const { client, calls } = fixture(); const profile = await loadPublicProfile(client, 'organisations', 'public-org');
    expect(profile?.row['contact_email']).toBeNull(); expect(calls).toContain('public_organisations'); expect(calls).not.toContain('organisations');
  });
  it('returns public person email through the contact RPC', async () => {
    const { client, calls } = fixture(); const profile = await loadPublicProfile(client, 'people', 'public-person');
    expect(profile?.row['contact_email']).toBe('public@example.org'); expect(calls).toContain('public_people'); expect(calls).not.toContain('people');
  });
  it('does not return a draft person profile', async () => {
    expect(await loadPublicProfile(fixture().client, 'people', 'draft-person')).toBeNull();
  });
  it('excludes draft related people', async () => {
    const profile = await loadPublicProfile(fixture().client, 'organisations', 'public-org');
    expect(profile?.related.find((group) => group.kind === 'people')?.entries.map((row) => row.slug)).toEqual(['public-person']);
  });
  it('excludes draft related events', async () => {
    const profile = await loadPublicProfile(fixture().client, 'organisations', 'public-org');
    expect(profile?.related.find((group) => group.kind === 'events')?.entries.map((row) => row.slug)).toEqual(['public-event']);
  });
  it('rejects executable external URLs', () => { expect(safeWebUrl('javascript:alert(1)')).toBeNull(); expect(safeWebUrl('https://example.org')).toBe('https://example.org/'); });
});
