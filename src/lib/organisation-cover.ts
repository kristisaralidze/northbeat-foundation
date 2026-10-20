import { parse } from 'node-html-parser';

export function publicWebsite(value: string): URL | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port)) || !host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || /\.(localhost|local|internal|test|invalid)$/.test(host)) return null;
    return url;
  } catch { return null; }
}
export function extractCover(html: string, website: string): string | null {
  const root = parse(html);
  for (const key of ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']) {
    const meta = root.querySelectorAll('meta').find(m => (m.getAttribute('property') ?? m.getAttribute('name'))?.toLowerCase() === key);
    const content = meta?.getAttribute('content')?.trim();
    if (!content) continue;
    try { const url = new URL(content, website); if (publicWebsite(url.href)) return url.href; } catch { /* Try the fallback. */ }
  }
  return null;
}
export function shouldDiscoverCover(previousWebsite: unknown, website: unknown, cover: unknown, editedCover: boolean): boolean {
  return !editedCover && !cover && typeof website === 'string' && website.trim() !== '' && website !== previousWebsite;
}
export function publicIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a = 0, b = 0] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && [0, 168].includes(b) || a === 100 && b >= 64 && b <= 127 || a === 198 && [18,19,51].includes(b) || a === 203 && b === 0);
}