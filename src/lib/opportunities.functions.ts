import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { OpportunitiesData } from './opportunities';

export const getOpportunities = createServerFn({ method: 'GET' }).handler(async (): Promise<OpportunitiesData> => {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Opportunities are temporarily unavailable.');
  const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const opportunities: OpportunitiesData['opportunities'] = [];
  const terms: OpportunitiesData['terms'] = [];
  const links: { opportunity_id: string; term_id: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('opportunities')
      .select('id,slug,title,type,summary,description,opens_at,deadline_at,amount_min_eur,amount_max_eur,location,employment_type,remote_ok,apply_url')
      .eq('status', 'published').order('id').range(offset, offset + 999);
    if (error) throw new Error('Opportunities could not be loaded.');
    opportunities.push(...(data ?? []).map((item) => ({ ...item, provider:providerFor(item.id), termIds: [] })));
    if (!data || data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('terms').select('id,kind,name,slug,parent_id,sort_order').in('kind', ['field', 'stage']).order('sort_order').order('name').order('id').range(offset, offset + 999);
    if (error) throw new Error('Opportunity filters could not be loaded.');
    terms.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('opportunity_terms').select('opportunity_id,term_id').order('opportunity_id').order('term_id').range(offset, offset + 999);
    if (error) throw new Error('Opportunity tags could not be loaded.');
    links.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const tags = new Map<string, string[]>();
  for (const link of links) tags.set(link.opportunity_id, [...(tags.get(link.opportunity_id) ?? []), link.term_id]);
  const providers = await client.from('organisation_opportunities').select('opportunity_id,role,organisations(name,slug,status)').in('opportunity_id',opportunities.map(o=>o.id));
  if(providers.error)throw new Error('Opportunity providers could not be loaded.');
  const providerFor = (id:string) => {const list=(providers.data??[]).filter(l=>l.opportunity_id===id&&l.organisations?.status==='published');const org=(list.find(l=>/provider/i.test(l.role))??list[0])?.organisations;return org?{name:org.name,slug:org.slug}:undefined;};
  return { opportunities: opportunities.map((item) => ({ ...item, provider:providerFor(item.id), termIds: tags.get(item.id) ?? [] })), terms, now: new Date().toISOString() };
});
