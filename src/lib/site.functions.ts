import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { newestDate, type SiteInfo } from './site';

function publicClient() {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Site details are temporarily unavailable.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
}

/** Public: contact details, founders and the newest last checked date on published entries. */
export const getSiteInfo = createServerFn({ method: 'GET' }).handler(async (): Promise<SiteInfo> => {
  const c = publicClient();
  const newest = (table: 'organisations' | 'events' | 'opportunities') => c.from(table).select('last_checked').eq('status', 'published').not('last_checked', 'is', null).order('last_checked', { ascending: false }).limit(1);
  const [settings, founders, o, e, p] = await Promise.all([
    c.from('site_settings').select('contact_email,linkedin_url,instagram_url').eq('id', 1).maybeSingle(),
    c.from('founders').select('id,name,one_line,photo_url,linkedin_url').order('sort_order').order('created_at'),
    newest('organisations'), newest('events'), newest('opportunities'),
  ]);
  return {
    contactEmail: settings.data?.contact_email ?? null,
    linkedinUrl: settings.data?.linkedin_url ?? null,
    instagramUrl: settings.data?.instagram_url ?? null,
    founders: founders.data ?? [],
    updatedOn: newestDate([o.data?.[0]?.last_checked, e.data?.[0]?.last_checked, p.data?.[0]?.last_checked]),
  };
});

const Email = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

/** Public Systole waitlist sign-up. Visitors cannot read the list; the same reply is returned for repeats. */
export const joinSystoleWaitlist = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => Email.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { error } = await supabaseAdmin.from('systole_waitlist').insert({ email: data.email });
    if (error && error.code !== '23505') throw new Error('Could not save your email right now.');
    return { ok: true as const };
  });
