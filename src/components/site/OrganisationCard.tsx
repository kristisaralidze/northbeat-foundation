import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Building2 } from "lucide-react";
import type { DirectoryOrganisation, DirectoryTerm } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";

export function OrganisationCard({ organisation: org, terms }: { organisation: DirectoryOrganisation; terms: DirectoryTerm[] }) {
  const [failed, setFailed] = useState(false);
  const tags = terms.filter((term) => org.termIds.includes(term.id));
  return (
    <article className="nb-card flex h-full min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="nb-org-logo">
          {org.logo_url && !failed ? <img src={org.logo_url} alt={`${org.name} logo`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <Building2 className="h-6 w-6 text-muted-foreground" aria-hidden />}
        </div>
        <span className="nb-small text-muted-foreground text-right">{humanize(org.type)}</span>
      </div>
      <div className="min-w-0">
        <h2 className="nb-h3 break-words"><Link to="/org/$slug" params={{ slug: org.slug }} className="nb-org-link">{org.name}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /></Link></h2>
        {org.short_description && <p className="nb-small mt-3 truncate text-muted-foreground" title={org.short_description}>{org.short_description}</p>}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">{tags.map((term) => <span className="nb-chip max-w-full" key={term.id}><span className="truncate">{term.name}</span></span>)}</div>
    </article>
  );
}