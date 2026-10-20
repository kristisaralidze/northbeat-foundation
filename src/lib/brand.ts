import { organisationDomain } from './organisation-logo';

export function ownDomain(image: string | null | undefined, website: string | null | undefined) {
  const host = organisationDomain(image); const domain = organisationDomain(website);
  return Boolean(host && domain && (host === domain || host.endsWith(`.${domain}`)));
}
export function isMediaUpload(image: string | null | undefined) {
  if (!image) return false;
  try { const url = new URL(image); return url.origin === new URL(import.meta.env['VITE_SUPABASE_URL']).origin && /^\/storage\/v1\/object\/(sign|authenticated|public)\/media\/.+/.test(url.pathname); } catch { return false; }
}
export function officialLogo(image: string | null | undefined, website: string | null | undefined, source?: string | null, sourceUrl?: string | null) {
  if (!image) return null;
  return (source === 'brandfetch' && sourceUrl?.startsWith('https://api.brandfetch.io/v2/brands/domain/')) || (source === 'admin_upload' && isMediaUpload(image)) || ownDomain(image, website) ? image : null;
}
export function brandPriority(type: string) { return type === 'investor' ? 0 : type === 'university' ? 1 : type === 'startup' ? 3 : 2; }
export function brandColour(value: unknown): string | null { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null; }
type Format = { src?: string; format?: string };
type Asset = { type?: string; theme?: string; formats?: Format[] };
export function parseBrand(value: unknown) {
  const data = value as { logos?: Asset[]; images?: Asset[]; colors?: { type?: string; hex?: string }[] };
  const url = (asset?: Asset) => asset?.formats?.find(f => f.format === 'svg' && f.src?.startsWith('https://'))?.src ?? asset?.formats?.find(f => f.src?.startsWith('https://'))?.src ?? null;
  const logo = (theme: string) => url(data.logos?.find(a => a.type === 'logo' && a.theme === theme) ?? data.logos?.find(a => a.type === 'icon' && a.theme === theme) ?? data.logos?.find(a => a.type === 'logo') ?? data.logos?.[0]);
  return { light: logo('light'), dark: logo('dark'), covers: (data.images ?? []).map(a => url(a)).filter((s): s is string => Boolean(s)), accent: brandColour(data.colors?.find(c => c.type === 'accent')?.hex), darkColour: brandColour(data.colors?.find(c => c.type === 'dark')?.hex), lightColour: brandColour(data.colors?.find(c => c.type === 'light')?.hex) };
}