import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { HeartbeatData, HeartbeatItem, HeartbeatOrg } from './heartbeat';

/** Published events and open deadlines in a window slightly wider than 35 days; the browser trims to its own calendar. */
export const getHeartbeat = createServerFn({ method: 'GET' }).handler(async (): Promise<HeartbeatData> => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('The calendar is temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const now = new Date();
  const from = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  const to = new Date(now.getTime() + 37 * 86_400_000).toISOString();
  const [events, opps] = await Promise.all([
    client.from('events').select('id,slug,title,starts_at,city').eq('status', 'published').gte('starts_at', from).lte('starts_at', to).limit(500),
    client.from('opportunities').select('id,slug,title,deadline_at,location').eq('status', 'published').gte('deadline_at', from).lte('deadline_at', to).limit(500),
  ]);
  if (events.error || opps.error) throw new Error('The calendar could not be loaded.');
  const eventIds = (events.data ?? []).map(e => e.id); const oppIds = (opps.data ?? []).map(o => o.id);
  const orgCols = 'name,website,logo_url,logo_choice,status';
  const [eo, oo] = await Promise.all([
    eventIds.length ? client.from('organisation_events').select(`event_id, organisations(${orgCols})`).in('event_id', eventIds) : Promise.resolve({ data: [], error: null }),
    oppIds.length ? client.from('organisation_opportunities').select(`opportunity_id, organisations(${orgCols})`).in('opportunity_id', oppIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const orgsFor = new Map<string, HeartbeatOrg[]>();
  const add = (id: string, org: unknown) => {
    const o = org as (HeartbeatOrg & { status: string }) | null;
    if (!o || o.status !== 'published') return;
    orgsFor.set(id, [...(orgsFor.get(id) ?? []), { name: o.name, website: o.website, logo_url: o.logo_url, logo_choice: o.logo_choice }]);
  };
  for (const row of (eo.data ?? []) as { event_id: string; organisations: unknown }[]) add(row.event_id, row.organisations);
  for (const row of (oo.data ?? []) as { opportunity_id: string; organisations: unknown }[]) add(row.opportunity_id, row.organisations);
  const items: HeartbeatItem[] = [
    ...(events.data ?? []).filter(e => e.starts_at).map(e => ({ id: e.id, slug: e.slug, kind: 'event' as const, title: e.title, date: e.starts_at!, city: e.city, orgs: orgsFor.get(e.id) ?? [] })),
    ...(opps.data ?? []).filter(o => o.deadline_at).map(o => ({ id: o.id, slug: o.slug, kind: 'opportunity' as const, title: o.title, date: o.deadline_at!, city: o.location, orgs: orgsFor.get(o.id) ?? [] })),
  ];
  return { items, now: now.toISOString() };
});
