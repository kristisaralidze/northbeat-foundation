import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganisationCard } from "@/components/site/OrganisationCard";
import { FilterChipRow, FilterStack } from "@/components/site/ExploreFilters";
import { CardGrid } from "@/components/site/EntryCard";
import { directoryQuery } from '@/lib/directory.query';
import { EMPTY_SEARCH, FACETS, GROUP_OPTIONS, cleanExploreSearch, filterOrganisations, parseExploreSearch, sortOrganisations, type ExploreSearch, type Facet } from "@/lib/explore";
import { humanize } from "@/lib/admin/entities";
import { FilterSheet } from '@/components/site/FilterSheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export const Route = createFileRoute("/explore")({
  validateSearch: parseExploreSearch,
  search: { middlewares: [({ search, next }) => cleanExploreSearch(next(search)) as ExploreSearch] },
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(directoryQuery); },
  head: () => ({
    meta: [
      { title: "Explore: Northbeat" },
      { name: "description", content: "Browse Nordic health companies, investors, programmes and research groups." },
      { property: "og:title", content: "Explore: Northbeat" },
      { property: "og:description", content: "Browse Nordic health companies, investors, programmes and research groups." },
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
  const results = useMemo(() => sortOrganisations(filterOrganisations(data, search), search.sort), [data, search]);
  const label = (facet: Facet, value: string) => facet === "group" ? GROUP_OPTIONS.find(g => g.value === value)?.label ?? humanize(value) : facet === "type" ? humanize(value) : data.terms.find((term) => term.kind === facet && term.slug === value)?.name ?? humanize(value);
  const selected = FACETS.flatMap((facet) => search[facet].map((value) => ({ facet, value, label: label(facet, value) })));
  const toggle = (facet: Facet, value: string) => { void navigate({ search: (prev) => ({ ...prev, [facet]: prev[facet].includes(value) ? prev[facet].filter((v) => v !== value) : [...prev[facet], value] }), resetScroll: false }); };
  const clear = () => { void navigate({ search: { ...EMPTY_SEARCH, sort: search.sort }, resetScroll: false }); };
  const filtered = selected.length > 0 || Boolean(search.q);
  return <div className="nb-container py-12 md:py-16">
    <header className="mb-8 flex flex-col gap-6">
      <h1 className="nb-h1">Explore</h1>
      <div className="nb-explore-search relative min-w-0">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input type="search" aria-label="Search organisations" placeholder="Search organisations" value={search.q} onChange={(event) => { void navigate({ search: (prev) => ({ ...prev, q: event.target.value }), replace: true, resetScroll: false }); }} className="nb-input" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="hidden md:block"><FilterChipRow data={data} search={search} onToggle={toggle} /></div>
        <div className="md:hidden"><Button variant="ghost" className="nb-explore-filter-trigger" data-active={selected.length > 0} onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="h-4 w-4" />Filters{selected.length ? ` (${selected.length})` : ''}</Button></div>
        <div className="ml-auto flex items-center gap-2 nb-small"><span id="explore-sort-label" className="text-muted-foreground">Sort</span>
          <Select value={search.sort} onValueChange={(value) => { void navigate({ search: (prev) => ({ ...prev, sort: value === 'recent' ? 'recent' : value === 'az' ? 'az' : 'featured' }), resetScroll: false }); }}>
            <SelectTrigger aria-labelledby="explore-sort-label" className="nb-explore-filter-trigger"><SelectValue /></SelectTrigger>
            <SelectContent className="theme-site nb-explore-menu"><SelectItem className="nb-explore-select-option" value="featured">Featured</SelectItem><SelectItem className="nb-explore-select-option" value="az">A to Z</SelectItem><SelectItem className="nb-explore-select-option" value="recent">Recently added</SelectItem></SelectContent>
          </Select></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="nb-small mr-2" aria-live="polite"><strong className="font-medium">{results.length}</strong> {results.length === 1 ? 'organisation' : 'organisations'}</p>
        {selected.map(({ facet, value, label }) => <Button key={`${facet}-${value}`} variant="ghost" size="sm" className="nb-chip" data-active="true" onClick={() => toggle(facet, value)} aria-label={`Remove ${label} filter`}>{label}<X className="h-3 w-3" aria-hidden /></Button>)}
        {filtered && <Button variant="ghost" size="sm" onClick={clear} className="text-primary">Clear filters</Button>}
      </div>
    </header>
    <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen}><FilterStack data={data} search={search} onToggle={toggle} /></FilterSheet>
    <section aria-label="Organisations" className="min-w-0">
      {results.length ? <div className="nb-directory-grid">{results.map((org) => <OrganisationCard key={org.id} organisation={org} terms={data.terms} />)}</div> : <div className="py-16">
        <h2 className="nb-h2">Nothing matches these filters.</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {filtered && <Button variant="ghost" onClick={clear} className="nb-btn nb-btn-secondary">Clear filters</Button>}
          <Button asChild variant="ghost" className="nb-btn nb-btn-primary"><Link to="/submit" search={{ tab: 'company' }}>Suggest an organisation</Link></Button>
        </div>
      </div>}
    </section>
  </div>;
}
