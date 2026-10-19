import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganisationCard } from "@/components/site/OrganisationCard";
import { DirectoryFilters } from "@/components/site/DirectoryFilters";
import { getDirectory } from "@/lib/explore.functions";
import { EMPTY_SEARCH, FACETS, filterOrganisations, parseExploreSearch, type Facet } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";

const directoryQuery = queryOptions({ queryKey: ["public-organisations"], queryFn: () => getDirectory(), staleTime: 60_000 });

export const Route = createFileRoute("/explore")({
  validateSearch: parseExploreSearch,
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(directoryQuery); },
  head: () => ({
    meta: [
      { title: "Explore — Northbeat" },
      { name: "description", content: "Browse Nordic health, medtech and biotech startups, investors, programmes and research groups." },
      { property: "og:title", content: "Explore — Northbeat" },
      { property: "og:description", content: "Browse Nordic health, medtech and biotech startups, investors, programmes and research groups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explore,
  errorComponent: DirectoryError,
  notFoundComponent: () => <div className="nb-container nb-section"><h1 className="nb-h2">Directory not found</h1></div>,
});

function DirectoryError() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return <div className="nb-container nb-section"><h1 className="nb-h2">Explore is temporarily unavailable</h1><p className="nb-body mt-4 text-danger" role="alert">The directory could not be loaded. Please try again.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await queryClient.resetQueries({ queryKey: directoryQuery.queryKey }); await router.invalidate(); }}>Try again</Button></div>;
}

function Explore() {
  const { data } = useSuspenseQuery(directoryQuery);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const results = filterOrganisations(data, search);
  const selected = FACETS.flatMap((facet) => search[facet].map((value) => ({ facet, value, label: facet === "type" ? humanize(value) : data.terms.find((term) => term.kind === facet && term.slug === value)?.name ?? humanize(value) })));
  const toggle = (facet: Facet, value: string) => { void navigate({ search: (prev) => ({ ...prev, [facet]: prev[facet].includes(value) ? prev[facet].filter((v) => v !== value) : [...prev[facet], value] }), resetScroll: false }); };
  const clear = () => { void navigate({ search: EMPTY_SEARCH, resetScroll: false }); };
  return <div className="nb-container py-12 md:py-16">
    <div className="mb-10 border-b border-hairline pb-8">
      <p className="nb-eyebrow mb-3">The Nordic healthtech directory</p>
      <h1 className="nb-h1">Explore</h1>
    </div>
    <div className="nb-directory-layout">
      <aside aria-label="Organisation filters">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="nb-h3">Filters</h2>
          {(selected.length > 0 || search.q) && <Button variant="ghost" size="sm" onClick={clear} className="text-primary">Clear all</Button>}
        </div>
        <Button variant="ghost" className="nb-btn nb-btn-quiet nb-btn-block mb-6 lg:hidden" aria-expanded={filtersOpen} aria-controls="directory-filters" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal aria-hidden />{filtersOpen ? "Hide filters" : `Show filters${selected.length ? ` (${selected.length})` : ""}`}</Button>
        <div id="directory-filters" className={filtersOpen ? "block" : "hidden lg:block"}><DirectoryFilters data={data} search={search} onToggle={toggle} /></div>
      </aside>
      <section aria-label="Organisations" className="min-w-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input type="search" aria-label="Search organisations" placeholder="Search organisations…" value={search.q} onChange={(event) => { void navigate({ search: (prev) => ({ ...prev, q: event.target.value }), replace: true, resetScroll: false }); }} className="nb-input pl-12" />
        </div>
        {selected.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selected.map(({ facet, value, label }) => <Button key={`${facet}-${value}`} variant="ghost" size="sm" className="nb-chip" data-active="true" onClick={() => toggle(facet, value)} aria-label={`Remove ${label} filter`}>{label}<X className="h-3 w-3" aria-hidden /></Button>)}</div>}
        <p className="nb-small my-6 text-muted-foreground" aria-live="polite">{results.length} {results.length === 1 ? "organisation" : "organisations"}</p>
        {results.length ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{results.map((org) => <OrganisationCard key={org.id} organisation={org} terms={data.terms} />)}</div> : <div className="border-y border-hairline py-16">
          <h2 className="nb-h2">{data.organisations.length ? "No matching organisations" : "No published organisations yet"}</h2>
          <p className="nb-body mt-4 text-muted-foreground">{data.organisations.length ? "Try a different search or fewer filters." : "The directory will appear here as entries are published."}</p>
          {(selected.length > 0 || search.q) && <Button variant="ghost" onClick={clear} className="nb-btn nb-btn-secondary mt-6">Clear search and filters</Button>}
        </div>}
      </section>
    </div>
  </div>;
}
