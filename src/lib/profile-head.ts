import type { PublicProfile } from './profiles';
import { ogImageMeta, SITE_URL, type OgKind } from './og';
export function profileHead(profile: PublicProfile | undefined, path: string, og?: { kind: OgKind; slug: string }) {
  const url = `${SITE_URL}${path}`;
  const title = profile ? `${profile.title}: Northbeat` : 'Entry unavailable: Northbeat';
  const description = profile?.summary ?? (profile ? `${profile.title}: people, organisations and opportunities in Nordic health innovation.` : 'This Northbeat entry is unavailable.');
  return { meta: [
    { title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description },
    { property: 'og:type', content: 'article' }, { property: 'og:url', content: url },
    ...(profile && og ? ogImageMeta(og.kind, og.slug, profile.title) : [{ name: 'twitter:card', content: 'summary' }]),
    ...(!profile ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
  ], links: [{ rel: 'canonical', href: url }] };
}
