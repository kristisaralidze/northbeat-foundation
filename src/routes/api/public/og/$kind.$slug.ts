import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { renderOgPng, type OgInput } from '@/lib/og-image.server';
import { previewLogoUrl, ogEyebrow } from '@/lib/og';

function publicClient() {
  const url = process.env['SUPABASE_URL']!; const key = process.env['SUPABASE_PUBLISHABLE_KEY']!;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
}
type Client = ReturnType<typeof publicClient>;
const ORG_COLS = 'name,type,city,short_description,website,logo_url,logo_choice,logo_image_source,logo_image_source_url,logo_resolved_url,logo_tone,logo_status';
type OrgRow = {logo_resolved_url:string|null;logo_tone:string|null;logo_status:string|null; name: string; type: string; city: string | null; short_description: string | null; website: string | null; logo_url: string | null; logo_choice: string | null; logo_image_source: string | null; logo_image_source_url: string | null };

async function linkedOrg(c: Client, table: 'organisation_events' | 'organisation_opportunities', column: 'event_id' | 'opportunity_id', id: string): Promise<OrgRow | null> {
  const { data } = await c.from(table).select(`role, organisations(${ORG_COLS},status)`).eq(column as never, id as never);
  const rows = (data ?? []) as unknown as { role: string; organisations: (OrgRow & { status: string }) | null }[];
  const published = rows.filter(r => r.organisations?.status === 'published');
  return (published.find(r => /organis|host|provider|funder/i.test(r.role)) ?? published[0])?.organisations ?? null;
}

async function inputFor(kind: string, slug: string): Promise<OgInput | null> {
  if (kind === 'site') return { home: true, eyebrow: '', title: '' };
  const c = publicClient();
  if (kind === 'org') {
    const { data } = await c.from('organisations').select(ORG_COLS).eq('slug', slug).eq('status', 'published').maybeSingle();
    if (!data) return null;
    return { eyebrow: ogEyebrow('org', data.type, data.city), title: data.name, subtitle: data.short_description, logoUrl: previewLogoUrl(data),logoTone:data.logo_tone,logoName:data.name };
  }
  if (kind === 'event') {
    const { data } = await c.from('events').select('id,title,event_type,starts_at,timezone,city,format,summary').eq('slug', slug).eq('status', 'published').maybeSingle();
    if (!data) return null;
    const org = await linkedOrg(c, 'organisation_events', 'event_id', data.id);
    return { eyebrow: ogEyebrow('event', data.event_type, data.format === 'online' ? 'Online' : data.city, data.starts_at, data.timezone), title: data.title, subtitle: data.summary, logoUrl: org ? previewLogoUrl(org) : null,logoTone:org?.logo_tone,logoName:org?.name };
  }
  if (kind === 'opportunity') {
    const { data } = await c.from('opportunities').select('id,title,type,deadline_at,summary').eq('slug', slug).eq('status', 'published').maybeSingle();
    if (!data) return null;
    const org = await linkedOrg(c, 'organisation_opportunities', 'opportunity_id', data.id);
    return { eyebrow: ogEyebrow('opportunity', data.type, null, data.deadline_at), title: data.title, subtitle: data.summary, logoUrl: org ? previewLogoUrl(org) : null,logoTone:org?.logo_tone,logoName:org?.name };
  }
  return null;
}

/** Link preview image (1200x630 PNG) for the homepage and published organisation, event and opportunity pages. */
export const Route = createFileRoute('/api/public/og/$kind/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const input = await inputFor(params.kind, params.slug).catch(() => null);
        if (!input) return new Response('Not found', { status: 404 });
        const png = await renderOgPng(input);
        return new Response(png as unknown as BodyInit, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } });
      },
    },
  },
});
