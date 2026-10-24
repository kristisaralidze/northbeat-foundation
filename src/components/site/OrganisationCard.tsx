import { Link } from "@tanstack/react-router";
import { cardTags, type DirectoryOrganisation, type DirectoryTerm } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";
import { OrganisationLogo } from './OrganisationLogo';
import { publicCopy } from '@/lib/profiles';
import { EntryCard } from './EntryCard';

export function OrganisationCard({ organisation: org, terms }: { organisation: DirectoryOrganisation; terms: DirectoryTerm[] }) {
  const { shown } = cardTags(org, terms);
  const field = shown.find(t => t.kind !== 'stage');
  return <EntryCard id={org.id} kind="organisation" slug={org.slug} title={org.name}
    media={<OrganisationLogo name={org.name} slug={org.slug} uploaded={org.logo_url} website={org.website} choice={org.logo_choice ?? null} />}
    link={<Link to="/org/$slug" params={{ slug: org.slug }} className="nb-org-link">{org.name}</Link>}
    line={org.short_description ? publicCopy(org.short_description) : null}
    facts={[humanize(org.type), org.city, field?.name]} />;
}
