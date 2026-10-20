import { useState, type ReactNode } from 'react';
import { safeWebUrl } from '@/lib/profiles';

export function OrganisationCover({ image, website, name, strip = false, fallback = null }: { image: string | null | undefined; website: string | null; name?: string; strip?: boolean; fallback?: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = safeWebUrl(image ?? null);
  const href = safeWebUrl(website);
  if (!src || failed === src) return fallback;
  return <figure className={strip ? 'nb-cover-strip' : 'nb-cover-banner'}>
    <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full object-cover" onError={() => setFailed(src)} ref={node => { if (node?.complete && node.naturalWidth === 0) setFailed(src); }} />
    {name && <figcaption className="nb-small mt-2 text-muted-foreground">{href ? <a className="nb-link" href={href} target="_blank" rel="noopener noreferrer">Image: {name}</a> : `Image: ${name}`}</figcaption>}
  </figure>;
}