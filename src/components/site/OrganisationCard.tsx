import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { cardTags, type DirectoryOrganisation, type DirectoryTerm } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";

export function OrganisationCard({ organisation: org, terms }: { organisation: DirectoryOrganisation; terms: DirectoryTerm[] }) {
  const [failed, setFailed] = useState(false);
  const { shown, extra } = cardTags(org, terms);
  return (
    <article className="nb-card flex h-full min-w-0 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="nb-org-logo">
          {org.logo_url && !failed
            ? <img src={org.logo_url} alt={`${org.name} logo`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-contain" />
            : <span className="font-display text-3xl leading-none text-primary" aria-hidden>{org.name.trim().charAt(0).toLocaleUpperCase()}</span>}
        </div>
        <span className="nb-small text-muted-foreground text-right">{humanize(org.type)}</span>
      </div>
      <div className="min-w-0">
        <h2 className="nb-h3 break-words"><Link to="/org/$slug" params={{ slug: org.slug }} className="nb-org-link">{org.name}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /></Link></h2>
        {org.short_description && <p className="nb-small mt-3 line-clamp-2 text-muted-foreground" title={org.short_description}>{org.short_description}</p>}
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        {shown.map((term) => <span className="nb-chip max-w-full" key={term.id}><span className="truncate">{term.name}</span></span>)}
        {extra > 0 && <span className="nb-chip" aria-label={`${extra} more tags`}>+{extra}</span>}
      </div>
    </article>
  );
}
