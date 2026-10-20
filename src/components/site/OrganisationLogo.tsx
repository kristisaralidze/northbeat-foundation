import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { acceptableLogoShape, acceptableLogoType, brandfetchLogoUrl } from '@/lib/organisation-logo';
import { isMediaUpload, ownDomain } from '@/lib/brand';

// Content-type checks are shared per URL so each logo is checked once per visit.
const typeChecks = new Map<string, Promise<boolean>>();
function checkType(src: string) {
  if (!src.startsWith('https://cdn.brandfetch.io/')) return Promise.resolve(true);
  let check = typeChecks.get(src);
  if (!check) { check = fetch(src, { method: 'HEAD', mode: 'cors' }).then(r => r.ok && acceptableLogoType(r.headers.get('content-type'))).catch(() => true); typeChecks.set(src, check); }
  return check;
}

/** Resolves the logo the admin chose: an upload/own-domain file, or a hotlinked Brandfetch version (icon by default). */
export function chosenLogoSrc(choice: string | null | undefined, uploaded: string | null | undefined, website: string | null | undefined) {
  if (choice === 'upload') return uploaded && (isMediaUpload(uploaded) || ownDomain(uploaded, website)) ? uploaded : null;
  return brandfetchLogoUrl(website, choice ?? 'icon');
}

export function OrganisationLogo({ name, slug, uploaded, website, eager = false, large = false, choice }: {
  name: string; slug?: string; uploaded?: string | null; website?: string | null; eager?: boolean; source?: string | null; sourceUrl?: string | null; large?: boolean; automatic?: boolean; choice?: string | null;
}) {
  const { data } = useQuery({ ...directoryQuery, enabled: Boolean(slug && (choice === undefined || website === undefined)) });
  const org = data?.organisations.find(org => org.slug === slug);
  const src = chosenLogoSrc(choice ?? org?.logo_choice, uploaded ?? org?.logo_url, website ?? org?.website);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  useEffect(() => { if (src) { let live = true; checkType(src).then(ok => { if (live && !ok) setFailedSrc(src); }); return () => { live = false; }; } }, [src]);
  if (!src || src === failedSrc) return null;
  const settle = (image: HTMLImageElement) => { if (acceptableLogoShape(image.naturalWidth, image.naturalHeight)) setLoadedSrc(src); else setFailedSrc(src); };
  return <span className={`${large ? 'nb-org-logo nb-official-logo-large' : 'nb-org-logo'}${loadedSrc === src ? '' : ' nb-logo-loading'}`} data-organisation-logo={slug}>
    <img ref={image => { if (image?.complete && loadedSrc !== src) { if (image.naturalWidth === 0) setFailedSrc(src); else settle(image); } }} src={src} alt={`${name} logo`} width={128} height={128} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={e => settle(e.currentTarget)} onError={() => setFailedSrc(src)} />
  </span>;
}
