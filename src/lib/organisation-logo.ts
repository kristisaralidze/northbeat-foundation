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