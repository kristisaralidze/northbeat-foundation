import { extractCover, publicIPv4, publicWebsite } from './organisation-cover';

export async function discoverWebsiteCover(website: string): Promise<string | null> {
  try {
    let url = publicWebsite(website);
    for (let redirects = 0; url && redirects < 5; redirects++) {
      const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=A`, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(5000) });
      const resolved = await dns.json() as { Answer?: { type: number; data: string }[] };
      const addresses = resolved.Answer?.filter(a => a.type === 1) ?? [];
      if (!addresses.length || addresses.some(a => !publicIPv4(a.data))) return null;
      const response = await fetch(url.href, { redirect: 'manual', headers: { Accept: 'text/html', 'User-Agent': 'NorthbeatCover/1.0' }, signal: AbortSignal.timeout(8000) });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        url = location ? publicWebsite(new URL(location, url).href) : null;
        continue;
      }
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) { await response.body?.cancel(); return null; }
      const reader = response.body?.getReader();
      if (!reader) return null;
      const decoder = new TextDecoder(); let html = ''; let bytes = 0;
      try { while (bytes < 512000) { const chunk = await reader.read(); if (chunk.done) break; bytes += chunk.value.length; html += decoder.decode(chunk.value, { stream: true }); if (html.toLowerCase().includes('</head>')) break; } } finally { await reader.cancel(); }
      return extractCover(html, url.href);
    }
  } catch { /* Unreachable sites have no cover. */ }
  return null;
}