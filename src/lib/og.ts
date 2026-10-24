import { officialLogo } from './brand';
import { brandfetchLogoUrl } from './organisation-logo';
import { humanize } from './admin/entities';
import { publicTitle } from './profiles';

export const SITE_URL = 'https://nordic-heartbeat.lovable.app';
export type OgKind = 'org' | 'event' | 'opportunity';

/** Absolute link preview image URL for a page. */
export const ogImageUrl = (kind: OgKind | 'site', slug: string) => `${SITE_URL}/api/public/og/${kind}/${encodeURIComponent(slug)}`;

/** Only official logos: an admin upload, else the Brandfetch icon for the organisation's own domain. */
export function previewLogoUrl(o: { logo_resolved_url?: string | null; logo_status?: string | null; website: string | null; logo_url: string | null; logo_choice: string | null; logo_image_source: string | null; logo_image_source_url: string | null }): string | null {
  const uploaded = officialLogo(o.logo_url, o.website, o.logo_image_source, o.logo_image_source_url);
  if (uploaded && (o.logo_choice === 'upload' || o.logo_image_source === 'admin_upload')) return uploaded;
  return o.logo_status === 'missing' ? null : o.logo_resolved_url ?? null;
}

function shortDate(value: string, timezone?: string | null) {
  try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: timezone ?? 'Europe/Helsinki' }).format(new Date(value)); } catch { return ''; }
}

/** Small line above the title: type plus place or date, comma separated. */
export function ogEyebrow(kind: OgKind, type: string, place: string | null, date?: string | null, timezone?: string | null): string {
  const parts = [humanize(type)];
  if (kind === 'event' && date) parts.push(shortDate(date, timezone));
  if (kind === 'opportunity' && date) parts.push(`Closes ${shortDate(date)}`);
  if (place) parts.push(place);
  return parts.filter(Boolean).join(', ');
}

/** Meta tags for a page's link preview image. */
export function ogImageMeta(kind: OgKind, slug: string, title: string) {
  const url = ogImageUrl(kind, slug);
  return [
    { property: 'og:image', content: url }, { property: 'og:image:width', content: '1200' }, { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: publicTitle(title) }, { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:image', content: url },
  ];
}
