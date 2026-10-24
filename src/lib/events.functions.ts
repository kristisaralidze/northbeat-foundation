import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { EventsData } from './events';
export const getEvents = createServerFn({ method: 'GET' }).handler(async (): Promise<EventsData> => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Events are temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const events: EventsData['events'] = []; const opportunities: EventsData['opportunities'] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('events').select('id,slug,title,event_type,summary,starts_at,ends_at,apply_deadline_at,timezone,city,venue,format').eq('status', 'published').order('id').range(offset, offset + 999);
    if (error) throw new Error('Events could not be loaded.'); events.push(...(data ?? [])); if (!data || data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('opportunities').select('id,slug,title,deadline_at').eq('status', 'published').not('deadline_at', 'is', null).order('id').range(offset, offset + 999);
    if (error) throw new Error('Deadlines could not be loaded.'); opportunities.push(...(data ?? [])); if (!data || data.length < 1000) break;
  }
  const links: { event_id: string; term_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('event_terms').select('event_id,term_id').order('event_id').order('term_id').range(offset, offset + 999);
    if (error) throw new Error('Event tags could not be loaded.'); links.push(...(data ?? [])); if (!data || data.length < 1000) break;
  }
  const { data: fieldRows, error: fieldError } = await client.rpc('public_terms').select('id,name,slug').eq('kind', 'field').order('sort_order').order('name');
  if (fieldError) throw new Error('Event fields could not be loaded.');
  const tags = new Map<string, string[]>(); for (const l of links) tags.set(l.event_id, [...(tags.get(l.event_id) ?? []), l.term_id]);
  const orgLinks = await client.from('organisation_events').select('event_id,role,organisations(name,slug,status)').in('event_id', events.map(e=>e.id));
  if (orgLinks.error) throw new Error('Event organisers could not be loaded.');
  const organiserFor = (id:string) => { const links = (orgLinks.data ?? []).filter(l=>l.event_id===id && l.organisations?.status==='published'); const o = (links.find(l=>/organi[sz]er|host/i.test(l.role)) ?? links[0])?.organisations; return o ? {name:o.name,slug:o.slug} : undefined; };
  const withTags = events.map(e => ({ ...e, organiser: organiserFor(e.id), termIds: tags.get(e.id) ?? [] }));
  const used = new Set(withTags.flatMap(e => e.termIds));
  return { events: withTags, opportunities, now: new Date().toISOString(), fields: (fieldRows ?? []).filter(f => used.has(f.id)) };
});
