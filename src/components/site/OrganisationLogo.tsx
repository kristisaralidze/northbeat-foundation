import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { organisationLogoUrl } from '@/lib/organisation-logo';

export function OrganisationLogo({ name, slug, uploaded, website, eager = false }: {
  name: string; slug?: string; uploaded?: string | null; website?: string | null; eager?: boolean;
}) {
  // Formats without logo fields reuse the safe, published directory query.
  const { data } = useQuery({ ...directoryQuery, enabled: Boolean(slug && uploaded === undefined && website === undefined) });
  const org = data?.organisations.find(org => org.slug === slug);
  const src = organisationLogoUrl(uploaded ?? org?.logo_url, website ?? org?.website);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <span className="nb-org-logo" data-organisation-logo={slug}>
    {src && src !== failedSrc
      ? <img src={src} alt={`${name} logo`} width={128} height={128} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(src)} />
      : <span className="nb-monogram" aria-hidden="true">{name.trim().charAt(0).toLocaleUpperCase()}</span>}
  </span>;
}