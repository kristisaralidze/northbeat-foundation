import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { buildGroups, buildNetwork, nodeId, type NetworkEdge, type NetworkData } from './ecosystem';
import { publicTitle } from './profiles';

async function all<T>(page: (a: number, b: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await page(offset, offset + 999);
    if (error) throw new Error('The ecosystem could not be loaded. Please try again.');
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}
export const getEcosystem = createServerFn({ method: 'GET' }).handler(async (): Promise<NetworkData> => {
  const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('The ecosystem is temporarily unavailable.');
  const c = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const [orgs, events, opps, relations, orgEvents, orgOpps, eventOpps] = await Promise.all([
    all((a, b) => c.from('organisations').select('id,slug,name,type,status').eq('status', 'published').order('id').range(a, b)),
    all((a, b) => c.from('events').select('id,slug,title,event_type,status').eq('status', 'published').order('id').range(a, b)),
    all((a, b) => c.from('opportunities').select('id,slug,title,type,status').eq('status', 'published').order('id').range(a, b)),
    all((a, b) => c.from('organisation_relations').select('from_org_id,to_org_id,relation').order('id').range(a, b)),
    all((a, b) => c.from('organisation_events').select('organisation_id,event_id,role').order('id').range(a, b)),
    all((a, b) => c.from('organisation_opportunities').select('organisation_id,opportunity_id,role').order('id').range(a, b)),
    all((a, b) => c.from('event_opportunities').select('event_id,opportunity_id,role').order('id').range(a, b)),
  ]);
  const roleRelation = (role: string) => {
    const clean = role.trim().toLowerCase().replace(/[\s-]+/g, '_');
    return ['organiser', 'organizer', 'organiser_of', 'organizer_of'].includes(clean) ? 'organiser_of' : ['provider', 'provider_of'].includes(clean) ? 'provider_of' : null;
  };
  const edges: NetworkEdge[] = relations.map(r => ({ source: nodeId('organisation', r.from_org_id), target: nodeId('organisation', r.to_org_id), relation: r.relation }));
  for (const r of orgEvents) { const relation = roleRelation(r.role); if (relation) edges.push({ source: nodeId('organisation', r.organisation_id), target: nodeId('event', r.event_id), relation }); }
  for (const r of orgOpps) { const relation = roleRelation(r.role); if (relation) edges.push({ source: nodeId('organisation', r.organisation_id), target: nodeId('opportunity', r.opportunity_id), relation }); }
  for (const r of eventOpps) { const relation = roleRelation(r.role); if (relation) edges.push({ source: nodeId('event', r.event_id), target: nodeId('opportunity', r.opportunity_id), relation }); }
  return buildNetwork([
    ...orgs.map(r => ({ ...r, kind: 'organisation' as const })),
    ...events.map(r => ({ ...r, name: r.title, type: r.event_type, kind: 'event' as const })),
    ...opps.map(r => ({ ...r, name: r.title, kind: 'opportunity' as const })),
  ], edges);
});
export const getEcosystemGroups = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('The ecosystem is temporarily unavailable.');
  const c = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const [orgs, relations, orgEvents, orgOpps] = await Promise.all([
    all((a, b) => c.from('organisations').select('id,slug,name,type,website,logo_url,logo_choice').eq('status', 'published').order('id').range(a, b)),
    all((a, b) => c.from('organisation_relations').select('from_org_id,to_org_id').order('id').range(a, b)),
    all((a, b) => c.from('organisation_events').select('organisation_id').order('id').range(a, b)),
    all((a, b) => c.from('organisation_opportunities').select('organisation_id').order('id').range(a, b)),
  ]);
  const links = new Map<string, number>(); const bump = (id: string) => links.set(id, (links.get(id) ?? 0) + 1);
  relations.forEach(r => { bump(r.from_org_id); bump(r.to_org_id); });
  orgEvents.forEach(r => bump(r.organisation_id)); orgOpps.forEach(r => bump(r.organisation_id));
  return buildGroups(orgs.map(o => ({ slug: o.slug, name: publicTitle(o.name), type: o.type, website: o.website, logo_url: o.logo_url, logo_choice: o.logo_choice, links: links.get(o.id) ?? 0 })));
});
