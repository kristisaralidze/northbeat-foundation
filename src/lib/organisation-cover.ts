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

export const MIN_COVER_WIDTH = 800;
const SPAM = /\b(casino|bonus|deposit|slots?|betting|loan\s+offer|crypto\s+giveaway|adult)\b/i;
const AD_HOSTS = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adnxs.com', 'taboola.com', 'outbrain.com', 'adservice.google.com', 'bit.ly', 'tinyurl.com', 't.co'];
export function blockedImageHost(value: string): boolean {
  try { const host = new URL(value).hostname.toLowerCase(); return AD_HOSTS.some(domain => host === domain || host.endsWith(`.${domain}`)); } catch { return true; }
}
const normalName = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function titleMatchesName(title: string, name: string): boolean {
  const expected = normalName(name); return expected.length > 0 && normalName(title).includes(expected);
}
export function coverPageDetails(html: string, website: string) {
  const root = parse(html);
  const title = root.querySelector('title')?.text.trim().slice(0, 1000) ?? '';
  root.querySelectorAll('script,style,noscript').forEach(node => node.remove());
  const pageText = root.text;
  const images = root.querySelectorAll('img').map(node => {
    const srcset = node.getAttribute('srcset') ?? '';
    const largest = srcset.split(',').map(part => part.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] ?? '0') - parseInt(a[1] ?? '0'))[0]?.[0];
    const source = largest || node.getAttribute('src') || node.getAttribute('data-src');
    try { return source ? { url: new URL(source, website).href, alt: node.getAttribute('alt') ?? '' } : null; } catch { return null; }
  }).filter((image): image is { url: string; alt: string } => image !== null && publicWebsite(image.url) !== null);
  const preferred = extractCover(html, website);
  const twitter = root.querySelectorAll('meta').find(m => ['twitter:image', 'twitter:image:src'].includes((m.getAttribute('name') ?? m.getAttribute('property') ?? '').toLowerCase()))?.getAttribute('content');
  let twitterImage: string | null = null;
  try { if (twitter) { const candidate = new URL(twitter, website).href; if (publicWebsite(candidate)) twitterImage = candidate; } } catch { /* Invalid fallback. */ }
  return { title, pageText, images, preferred, twitterImage };
}
export function coverSafetyReason(input: { title: string; name: string; website: string; finalUrl: string; pageText: string; alt: string; image: string; width: number }): string | null {
  const spam = `${input.pageText} ${input.alt}`.match(SPAM);
  if (spam) return `Unsafe content: ${spam[0].toLowerCase()}`;
  if (blockedImageHost(input.image)) return 'Known advertising or redirect image domain';
  const host = (value: string) => new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  const titleHasDomain = input.title.toLowerCase().includes(host(input.website));
  if (!input.title || (!titleMatchesName(input.title, input.name) && !titleHasDomain && host(input.finalUrl) !== host(input.website))) return 'Page title and final domain do not match the entry';
  if (input.width < MIN_COVER_WIDTH) return `Image is ${input.width}px wide; minimum is 800px`;
  return null;
}
export function approvedCover(image: unknown, status: unknown): string | null { return status === 'approved' && typeof image === 'string' ? image : null; }