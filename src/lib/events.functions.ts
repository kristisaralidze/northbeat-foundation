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
  return { events, opportunities, now: new Date().toISOString() };
});
