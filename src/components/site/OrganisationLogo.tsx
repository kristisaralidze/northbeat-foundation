import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { acceptableLogoShape, brandfetchLogoUrl, organisationDomain } from '@/lib/organisation-logo';
import { isMediaUpload, ownDomain } from '@/lib/brand';

// A browser cannot read an <img>'s file type, so photos (JPEG) are detected by their pixels:
// fully opaque with many distinct colours. Logos are transparent or use few flat colours.
function looksLikePhoto(image: HTMLImageElement) {
  try {
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return false;
    ctx.drawImage(image, 0, 0, 32, 32);
    const px = ctx.getImageData(0, 0, 32, 32).data; const colours = new Set<number>();
    for (let i = 0; i < px.length; i += 4) { if (px[i + 3]! < 250) return false; colours.add((px[i]! >> 4) << 8 | (px[i + 1]! >> 4) << 4 | (px[i + 2]! >> 4)); }
    return colours.size > 180;
  } catch { return false; }
}

/** Resolves the logo the admin chose: an upload/own-domain file, or a hotlinked Brandfetch version (icon by default). */
export function chosenLogoSrc(choice: string | null | undefined, uploaded: string | null | undefined, website: string | null | undefined) {
  if (choice === 'verified') return uploaded ?? null;
  // Organisations without their own website show their name only, never a guessed logo.
  if (!organisationDomain(website)) return null;
  if (choice === 'upload') return uploaded && (isMediaUpload(uploaded) || ownDomain(uploaded, website)) ? uploaded : null;
  return brandfetchLogoUrl(website, choice ?? 'icon');
}

export function OrganisationLogo({ name, slug, uploaded, website, eager = false, large = false, choice }: {
  name: string; slug?: string; uploaded?: string | null; website?: string | null; eager?: boolean; source?: string | null; sourceUrl?: string | null; large?: boolean; automatic?: boolean; choice?: string | null;
}) {
  const { data } = useQuery({ ...directoryQuery, enabled: Boolean(slug && (choice === undefined || website === undefined)) });
  const org = data?.organisations.find(org => org.slug === slug);
  const src = chosenLogoSrc(choice ?? org?.logo_choice, uploaded ?? org?.logo_url, website === undefined ? org?.website : website);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) return null;
  const settle = (image: HTMLImageElement) => { const brandfetch = src.startsWith('https://cdn.brandfetch.io/'); if (acceptableLogoShape(image.naturalWidth, image.naturalHeight) && !(brandfetch && looksLikePhoto(image))) setLoadedSrc(src); else setFailedSrc(src); };
  return <span className={`${large ? 'nb-org-logo nb-official-logo-large' : 'nb-org-logo'}${loadedSrc === src ? '' : ' nb-logo-loading'}`} data-organisation-logo={slug}>
    <img crossOrigin={src.startsWith('https://cdn.brandfetch.io/') ? 'anonymous' : undefined} ref={image => { if (image?.complete && loadedSrc !== src) { if (image.naturalWidth === 0) setFailedSrc(src); else settle(image); } }} src={src} alt={`${name} logo`} width={128} height={128} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={e => settle(e.currentTarget)} onError={() => setFailedSrc(src)} />
  </span>;
}

/** Where a logo comes from, for the admin Logo check. */
export function logoSource(choice: string | null | undefined, uploaded: string | null | undefined, website: string | null | undefined) {
  if (!organisationDomain(website)) return 'No website: name only';
  const src = chosenLogoSrc(choice, uploaded, website);
  if (!src) return 'None: name only';
  if (src.startsWith('https://cdn.brandfetch.io/')) return `Brandfetch (${choice ?? 'icon'})`;
  return isMediaUpload(src) ? 'Admin upload' : 'Own website file';
}
