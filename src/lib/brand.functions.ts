import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { brandPriority, parseBrand } from './brand';
import { organisationDomain } from './organisation-logo';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

export const fetchBrandBatch = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ run: z.boolean().default(false) })).handler(async ({ data, context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error || role.data !== true) throw new Error('Admin access required.');
  const rows: Pick<Database['public']['Tables']['organisations']['Row'], 'id'|'name'|'type'|'website'|'brand_fetched_at'|'brand_fetch_status'|'brand_fetch_reason'|'logo_url'|'brand_cover_urls'|'brand_accent'|'brand_dark'|'brand_light'>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await context.supabase.from('organisations').select('id,name,type,website,brand_fetched_at,brand_fetch_status,brand_fetch_reason,logo_url,brand_cover_urls,brand_accent,brand_dark,brand_light').order('id').range(offset, offset + 999);
    if (result.error) throw new Error('Could not load organisations.'); rows.push(...(result.data ?? [])); if ((result.data?.length ?? 0) < 1000) break;
  }
  const published = await context.supabase.from('organisations').select('id').eq('status', 'published');
  if (published.error) throw new Error('Could not load published organisations.');
  const ids = new Set(published.data?.map(r => r.id));
  const ordered = rows.filter(r => ids.has(r.id) && organisationDomain(r.website) && !r.brand_fetched_at).sort((a,b) => brandPriority(a.type)-brandPriority(b.type) || a.name.localeCompare(b.name));
  const report = () => ({ logos: rows.filter(r => r.brand_fetched_at && r.logo_url).length, images: rows.filter(r => r.brand_fetched_at && Array.isArray(r.brand_cover_urls) && r.brand_cover_urls.length).length, colours: rows.filter(r => r.brand_fetched_at && (r.brand_accent || r.brand_dark || r.brand_light)).length, empty: rows.filter(r => r.brand_fetch_status === 'empty').map(r => r.name), failed: rows.filter(r => r.brand_fetch_status === 'failed').map(r => ({ name: r.name, reason: r.brand_fetch_reason })), remaining: ordered.length });
  if (!data.run) return { ...report(), stopped: false, name: null };
  const row = ordered[0]; if (!row) return { ...report(), stopped: false, name: null };
  const key = process.env['BRANDFETCH_API_KEY']; if (!key) throw new Error('Add your Brandfetch API key first.');
  const domain = organisationDomain(row.website); if (!domain) throw new Error('No valid website.');
  const source = `https://api.brandfetch.io/v2/brands/domain/${encodeURIComponent(domain)}`;
  let response: Response;
  try { response = await fetch(source, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) }); }
  catch {
    const saved = await context.supabase.from('organisations').update({ brand_fetched_at: new Date().toISOString(), brand_fetch_status: 'failed', brand_fetch_reason: 'Brandfetch request timed out or could not load' }).eq('id',row.id).is('brand_fetched_at',null);
    if (saved.error) throw new Error('Could not save the import failure.');
    return { ...report(), remaining: Math.max(0,ordered.length-1), stopped:false, name:row.name };
  }
  if (response.status === 429) { await response.body?.cancel(); return { ...report(), stopped: true, name: row.name }; }
  if (response.status === 401 || response.status === 403) { await response.body?.cancel(); throw new Error('Brandfetch did not accept the key or access to this API. Import stopped.'); }
  const result = response.ok ? parseBrand(await response.json()) : parseBrand({});
  const update: Database['public']['Tables']['organisations']['Update'] = { brand_fetched_at: new Date().toISOString(), brand_fetch_status: response.ok ? result.light || result.covers.length || result.accent || result.darkColour || result.lightColour ? 'ok' : 'empty' : response.status === 404 ? 'empty' : 'failed', brand_fetch_reason: response.ok || response.status === 404 ? null : `Brandfetch HTTP ${response.status}`, brand_logo_light_url: result.light, brand_logo_dark_url: result.dark, brand_cover_urls: result.covers, brand_accent: result.accent, brand_dark: result.darkColour, brand_light: result.lightColour };
  // An uploaded/own-domain logo always keeps priority.
  if (!row.logo_url && result.light) Object.assign(update, { logo_url: result.light, logo_image_source: 'brandfetch', logo_image_source_url: source });
  const current = await context.supabase.from('organisations').select('cover_image_url,cover_image_pending_url,image_source,cover_image_flag').eq('id',row.id).single();
  if (current.error) throw new Error('Could not read current assets.');
  if (result.covers[0] && !current.data.cover_image_url && current.data.image_source !== 'admin_upload' && current.data.cover_image_flag !== 'Rejected by admin') Object.assign(update, { cover_image_pending_url: result.covers[0], cover_image_status: 'pending', cover_image_flag: null, image_source: 'brandfetch', image_source_url: source, image_uploaded_by: null, cover_page_title: `Brandfetch: ${row.name}` });
  let save = context.supabase.from('organisations').update(update).eq('id', row.id).is('brand_fetched_at', null);
  save = row.logo_url ? save.eq('logo_url',row.logo_url) : save.is('logo_url',null);
  save = current.data.cover_image_pending_url ? save.eq('cover_image_pending_url',current.data.cover_image_pending_url) : save.is('cover_image_pending_url',null);
  save = current.data.cover_image_url ? save.eq('cover_image_url',current.data.cover_image_url) : save.is('cover_image_url',null);
  const saved = await save.select('id');
  if (saved.error) throw new Error('Could not save brand data.');
  return { ...report(), remaining: Math.max(0,ordered.length-1), stopped: false, name: row.name };
});