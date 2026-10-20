import { imageSize } from 'image-size';
import { blockedImageHost, coverPageDetails, coverSafetyReason, publicIPv4, publicWebsite, titleMatchesName } from './organisation-cover';

async function safeFetch(value: string, image = false) {
  let url = publicWebsite(value);
  const signal = AbortSignal.timeout(20000);
  for (let redirects = 0; url && redirects < 5; redirects++) {
    if (image && blockedImageHost(url.href)) throw new Error('Known advertising or redirect image domain');
    const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=A`, { headers: { Accept: 'application/dns-json' }, signal });
    const resolved = await dns.json() as { Answer?: { type: number; data: string }[] };
    const addresses = resolved.Answer?.filter(a => a.type === 1) ?? [];
    if (!addresses.length || addresses.some(a => !publicIPv4(a.data))) throw new Error('Website address could not be safely resolved');
    const response = await fetch(url.href, { redirect: 'manual', headers: { Accept: image ? 'image/*' : 'text/html', 'User-Agent': 'NorthbeatSafety/1.0' }, signal });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location'); await response.body?.cancel();
      url = location ? publicWebsite(new URL(location, url).href) : null; continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Website returned HTTP ${response.status}`); }
    if (!response.headers.get('content-type')?.includes(image ? 'image/' : 'text/html')) { await response.body?.cancel(); throw new Error(image ? 'Image URL did not return an image' : 'Website did not return an HTML page'); }
    const reader = response.body?.getReader(); if (!reader) throw new Error('Empty response');
    const limit = image ? 5 * 1024 * 1024 : 1024 * 1024;
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > limit) throw new Error(image ? 'Image exceeds 5 MB safety limit' : 'Page exceeds 1 MB safety limit'); chunks.push(chunk.value); } } finally { await reader.cancel(); }
    const bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0)); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return { bytes, url: url.href };
  }
  throw new Error('Website redirect could not be safely followed');
}
export async function inspectWebsite(website: string, name: string) {
  try {
    const page = await safeFetch(website); const details = coverPageDetails(new TextDecoder().decode(page.bytes), page.url);
    return { ...details, finalUrl: page.url, reason: titleMatchesName(details.title, name) ? null : 'Page title does not contain the organisation name' };
  } catch (error) { return { title: '', pageText: '', images: [], preferred: null, twitterImage: null, finalUrl: website, reason: error instanceof Error ? error.message : 'Website could not be loaded' }; }
}
export async function inspectWebsiteCover(website: string, name: string) {
  const page = await inspectWebsite(website, name);
  // Loading failures are not the same as a title mismatch, which the domain rule may allow.
  if (page.reason && page.reason !== 'Page title does not contain the organisation name') return { image: null, title: page.title, reason: page.reason };
  const candidates = [...new Set([page.preferred, page.twitterImage, ...page.images.map(i => i.url)].filter((url): url is string => Boolean(url)))].slice(0, 16);
  let reason = 'No candidate image found'; let best: { image: string; width: number; reason: string | null } | null = null;
  for (const image of candidates) {
    try {
      const fetched = await safeFetch(image, true); const dimensions = imageSize(fetched.bytes);
      if (dimensions.type === 'svg') { reason = 'Vector image has no verified 800px raster width'; continue; }
      const width = dimensions.width ?? 0;
      const checked = coverSafetyReason({ title: page.title, name, website, finalUrl: page.finalUrl, pageText: page.pageText, alt: page.images.find(i => i.url === image)?.alt ?? '', image: fetched.url, width });
      if (checked) { reason = checked; if (checked.startsWith('Unsafe content') || checked.startsWith('Known advertising')) return { image: null, title: page.title, reason: checked }; continue; }
      if (image === page.preferred || image === page.twitterImage) return { image: fetched.url, title: page.title, reason: null };
      if (!best || width > best.width) best = { image: fetched.url, width, reason: null };
    } catch (error) { reason = error instanceof Error ? error.message : 'Image could not be checked'; }
  }
  return { image: best?.image ?? null, title: page.title, reason: best ? null : reason };
}
export async function discoverWebsiteCover(website: string): Promise<string | null> { return (await inspectWebsiteCover(website, new URL(website).hostname)).image; }