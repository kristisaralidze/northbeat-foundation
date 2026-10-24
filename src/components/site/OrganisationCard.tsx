import { memo } from 'react';
import { Link } from "@tanstack/react-router";
import { type DirectoryOrganisation, type DirectoryTerm } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";
import { OrganisationLogo } from './OrganisationLogo';
import { publicCopy } from '@/lib/profiles';
import { SaveButton } from './SaveButton';
export const OrganisationCard = memo(function OrganisationCard({ organisation: org, terms }: { organisation: DirectoryOrganisation; terms: DirectoryTerm[] }) {
  const country = terms.filter(t => t.kind === 'country' && org.termIds.includes(t.id)).map(t => t.name).join(', ');
  return <article data-result-id={org.id} className="nb-directory-row">
    <OrganisationLogo name={org.name} slug={org.slug} uploaded={org.logo_url} website={org.website} choice={org.logo_choice ?? null} resolved={org.logo_resolved_url} tone={org.logo_tone} status={org.logo_status} />
    <div className="min-w-0"><h2 className="nb-h3"><Link to="/org/$slug" params={{slug:org.slug}} className="nb-org-link">{org.name}</Link></h2>
      <p className="nb-small text-muted-foreground">{humanize(org.type)} · {[org.city,country].filter(Boolean).join(', ')}</p>
      {org.parent_name && <p className="nb-small text-muted-foreground">Part of {org.parent_name}</p>}
      {org.short_description && <p className="nb-directory-description">{publicCopy(org.short_description)}</p>}
    </div><SaveButton kind="organisation" slug={org.slug} title={org.name} />
  </article>;
});
