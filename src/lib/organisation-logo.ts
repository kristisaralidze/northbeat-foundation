/** Public Brandfetch client ID, safe to include in image URLs. */
export const BRANDFETCH_CLIENT_ID = '1idCGaWDUDXkjAD579-';
export function organisationDomain(website?: string | null): string | null {
  if (!website?.trim()) return null;
  try {
    const value = website.trim();
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    const domain = url.hostname.toLowerCase().replace(/^www\./, '');
    return domain.includes('.') && !domain.includes(':') ? domain : null;
  } catch { return null; }
}
export function organisationLogoUrl(uploaded?: string | null, website?: string | null, clientId = BRANDFETCH_CLIENT_ID): string | null {
  if (uploaded?.trim()) return uploaded.trim();
  const domain = organisationDomain(website);
  return domain && clientId.trim() ? `https://cdn.brandfetch.io/domain/${domain}/w/128/h/128/fallback/404/type/icon?c=${encodeURIComponent(clientId.trim())}` : null;
}
export const LOGO_CHOICES = ['icon', 'icon-dark', 'logo', 'logo-dark', 'symbol', 'symbol-dark'] as const;
export type LogoChoice = typeof LOGO_CHOICES[number] | 'upload';
/** Hotlinked Brandfetch CDN URL for one logo version; fallback=404 errors instead of the placeholder. */
export function brandfetchLogoUrl(website: string | null | undefined, choice: string = 'icon', clientId = BRANDFETCH_CLIENT_ID): string | null {
  const domain = organisationDomain(website);
  if (!domain || !clientId.trim()) return null;
  const [type, theme] = (LOGO_CHOICES as readonly string[]).includes(choice) ? choice.split('-') : ['icon'];
  return `https://cdn.brandfetch.io/domain/${domain}/w/256/h/256${theme ? `/theme/${theme}` : ''}/type/${type}?c=${encodeURIComponent(clientId.trim())}&fallback=404`;
}
/** Logos wider than 3:1 are rejected. */
export function acceptableLogoShape(width: number, height: number) { return width > 0 && height > 0 && width / height <= 3; }
/** Photos (JPEG) are never accepted as Brandfetch logos. */
export function acceptableLogoType(contentType: string | null) { return !contentType || !/image\/(jpe?g|pjpeg)/i.test(contentType); }
