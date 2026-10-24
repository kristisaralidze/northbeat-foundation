import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { SearchItem } from './search';

/** Published-only, safe-column index used by site search and the Saved page. */
export const getSearchIndex = createServerFn({ method: 'GET' }).handler(async (): Promise<{ items: SearchItem[]; now: string }> => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Search is temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  async function all<T>(table: 'organisations' | 'events' | 'opportunities' | 'guides' | 'glossary_terms', columns: string): Promise<T[]> {
    const rows: T[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.from(table).select(columns).eq('status', 'published').order('id').range(offset, offset + 999);
      if (error) throw new Error('Search could not be loaded.');
      rows.push(...(data ?? []) as T[]); if (!data || data.length < 1000) break;
    }
    return rows;
  }
  type R = Record<string, string | number | null>;
  const [orgs, events, opps, guides, glossary] = await Promise.all([
    all<R>('organisations', 'slug,name,short_description,type,city,logo_url,website,logo_choice'),
    all<R>('events', 'slug,title,summary,event_type,city,starts_at,ends_at,format'),
    all<R>('opportunities', 'slug,title,summary,type,location,deadline_at,amount_min_eur,amount_max_eur'),
    all<R>('guides', 'slug,title,one_sentence'),
    all<R>('glossary_terms', 'slug,term,short_definition'),
  ]);
  const s = (v: unknown) => (typeof v === 'string' && v ? v : null); const n = (v: unknown) => (typeof v === 'number' ? v : v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
  const base = { line: null, type: null, city: null, date: null, end: null, logo: null, website: null, logoChoice: null, amountMin: null, amountMax: null, online: false };
  const items: SearchItem[] = [
    ...orgs.map(o => ({ ...base, kind: 'organisation' as const, slug: String(o['slug']), title: String(o['name']), line: s(o['short_description']), type: s(o['type']), city: s(o['city']), logo: s(o['logo_url']), website: s(o['website']), logoChoice: s(o['logo_choice']) })),
    ...events.map(e => ({ ...base, kind: 'event' as const, slug: String(e['slug']), title: String(e['title']), line: s(e['summary']), type: s(e['event_type']), city: s(e['city']), date: s(e['starts_at']), end: s(e['ends_at']), online: e['format'] === 'online' })),
    ...opps.map(o => ({ ...base, kind: 'opportunity' as const, slug: String(o['slug']), title: String(o['title']), line: s(o['summary']), type: s(o['type']), city: s(o['location']), date: s(o['deadline_at']), amountMin: n(o['amount_min_eur']), amountMax: n(o['amount_max_eur']) })),
    ...guides.map(g => ({ ...base, kind: 'guide' as const, slug: String(g['slug']), title: String(g['title']), line: s(g['one_sentence']) })),
    ...glossary.map(g => ({ ...base, kind: 'glossary' as const, slug: String(g['slug']), title: String(g['term']), line: s(g['short_definition']) })),
  ];
  return { items, now: new Date().toISOString() };
});
