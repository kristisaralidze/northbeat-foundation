import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { organisationLogoUrl } from '@/lib/organisation-logo';
import { officialLogo } from '@/lib/brand';

export function OrganisationLogo({ name, slug, uploaded, website, eager = false, source, sourceUrl, large = false, automatic = true }: {
  name: string; slug?: string; uploaded?: string | null; website?: string | null; eager?: boolean; source?: string | null; sourceUrl?: string | null; large?: boolean; automatic?: boolean;
}) {
  // Formats without logo fields reuse the safe, published directory query.
  const { data } = useQuery({ ...directoryQuery, enabled: Boolean(slug && uploaded === undefined && website === undefined) });
  const org = data?.organisations.find(org => org.slug === slug);
  const domainWebsite = website ?? org?.website;
  const verified = officialLogo(uploaded ?? org?.logo_url, domainWebsite, source ?? org?.logo_image_source, sourceUrl ?? org?.logo_image_source_url);
  const src = verified ?? (automatic ? brandfetchLogoUrl(domainWebsite, 'icon') : null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  if (!src || src === failedSrc) return null;
  return <span className={`${large ? 'nb-org-logo nb-official-logo-large' : 'nb-org-logo'}${loadedSrc === src ? '' : ' nb-logo-loading'}`} data-organisation-logo={slug}>
    <img ref={image => { if (image?.complete) { if (image.naturalWidth === 0) setFailedSrc(src); else setLoadedSrc(src); } }} src={src} alt={`${name} logo`} width={128} height={128} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoadedSrc(src)} onError={() => setFailedSrc(src)} />
  </span>;
}