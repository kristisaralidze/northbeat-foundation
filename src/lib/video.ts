/** Official video helpers: YouTube or Vimeo only, from a channel on the same platform. */
export type OfficialVideo = { platform: 'youtube' | 'vimeo'; id: string; embedUrl: string; thumbnail: string | null };

function parse(value: string | null | undefined): URL | null {
  if (!value) return null;
  try { const url = new URL(value.trim()); return url.protocol === 'https:' ? url : null; } catch { return null; }
}
const host = (url: URL) => url.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');

export function parseVideo(value: string | null | undefined): OfficialVideo | null {
  const url = parse(value); if (!url) return null; const h = host(url);
  let id: string | null = null;
  if (h === 'youtu.be') id = url.pathname.slice(1).split('/')[0] ?? null;
  else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else { const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/); id = m?.[1] ?? null; }
  }
  if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { platform: 'youtube', id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  if (h === 'vimeo.com' || h === 'player.vimeo.com') {
    const m = url.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);
    if (m?.[1]) return { platform: 'vimeo', id: m[1], embedUrl: `https://player.vimeo.com/video/${m[1]}?autoplay=1&dnt=1`, thumbnail: null };
  }
  return null;
}

/** Channel URL on the same platform as the video, e.g. youtube.com/@name or vimeo.com/name. */
export function isOfficialChannel(channel: string | null | undefined, video: OfficialVideo | null): boolean {
  const url = parse(channel); if (!url || !video) return false; const h = host(url); const path = url.pathname;
  if (video.platform === 'youtube') return h === 'youtube.com' && /^\/(@[\w.-]+|channel\/UC[\w-]{22}|c\/[\w.-]+|user\/[\w.-]+)\/?/.test(path);
  return h === 'vimeo.com' && /^\/(?!\d+\/?$)[\w-]+\/?$/.test(path);
}

/** A video is shown only when it parses and has a matching official channel. */
export function officialVideo(video: string | null | undefined, channel: string | null | undefined): OfficialVideo | null {
  const parsed = parseVideo(video);
  return parsed && isOfficialChannel(channel, parsed) ? parsed : null;
}
