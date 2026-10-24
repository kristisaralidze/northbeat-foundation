import { useMemo } from 'react';
import { ListFilterSelect } from '@/components/site/ListFilterSelect';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { OPP_TYPES, humanize } from '@/lib/admin/entities';
import { opportunitiesQuery } from '@/lib/opportunities.query';
import { compactSearch } from '@/lib/search-params';
import { amountLabel, filterOpportunities, friendlyDate, isRolling, splitOpen, type OpportunityRow } from '@/lib/opportunities';
import { publicTitle, publicCopy, safeWebUrl } from '@/lib/profiles';
import { CardGrid } from '@/components/site/EntryCard';
import { OpportunityCard } from '@/components/site/ListItems';
import { CalendarMenu } from '@/components/site/CalendarMenu';
import { daysUntil, type CalendarEvent } from '@/lib/detail';

const searchSchema = z.object({
  type: fallback(z.string(), '').default(''),
  field: fallback(z.string(), '').default(''),
  stage: fallback(z.string(), '').default(''),
  archive: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute('/opportunities')({
  validateSearch: zodValidator(searchSchema),
  search: { middlewares: [({ search, next }) => compactSearch(next(search))] },
  loader: ({ context }) => context.queryClient.ensureQueryData(opportunitiesQuery),
  head: () => ({ meta: [
    { title: 'Opportunities: Northbeat' },
    { name: 'description', content: 'Programme intakes, grant calls, competitions and jobs in Nordic health innovation, sorted by nearest deadline.' },
    { property: 'og:title', content: 'Opportunities: Northbeat' },
    { property: 'og:description', content: 'Programme intakes, grant calls, competitions and jobs in Nordic health innovation, sorted by nearest deadline.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: '/opportunities' },
    { name: 'twitter:card', content: 'summary' },
  ], links: [{ rel: 'canonical', href: '/opportunities' }] }),
  component: Opportunities,
  errorComponent: ({ reset }) => { const client = useQueryClient(); return <div className="nb-container nb-section nb-opportunities-page"><h1 className="nb-h2">Opportunities couldn’t be loaded</h1><p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await client.resetQueries({ queryKey: ['public-opportunities'] }); reset(); }}>Try again</Button></div>; },
  notFoundComponent: () => <div className="nb-container nb-section nb-opportunities-page"><h1 className="nb-h2">Opportunities not found</h1></div>,
});

function Opportunities() {
  const { data } = useSuspenseQuery(opportunitiesQuery);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/opportunities' });
  const { opportunities, open, types, fields, stages } = useMemo(() => {
    const filters = { type: search.type, field: search.field, stage: search.stage, archive: search.archive };
    const opportunities = filterOpportunities(data, filters);
    const has = (patch: Partial<typeof filters>) => filterOpportunities(data, { ...filters, ...patch }).length > 0;
    return { opportunities, open: splitOpen(opportunities),
      types: OPP_TYPES.filter(type => has({ type }) || type === search.type),
      fields: data.terms.filter(term => term.kind === 'field' && (has({ field: term.slug }) || term.slug === search.field)),
      stages: data.terms.filter(term => term.kind === 'stage' && (has({ stage: term.slug }) || term.slug === search.stage)),
    };
  }, [data, search.type, search.field, search.stage, search.archive]);
  const update = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, ...patch }), resetScroll: false });
  const hasFilters = search.type || search.field || search.stage;

  return <div className="nb-container nb-section nb-opportunities-page">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div><h1 className="nb-h1">Opportunities</h1></div>
      <div className="flex gap-2" aria-label="Opportunity period">
        <Button variant="ghost" className={`nb-btn ${!search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={!search.archive} onClick={() => update({ archive: false })}>Open</Button>
        <Button variant="ghost" className={`nb-btn ${search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={search.archive} onClick={() => update({ archive: true })}>Closed</Button>
      </div>
    </header>
    <div className="flex flex-wrap items-end gap-4 border-b border-hairline pb-6">
      <ListFilterSelect label="Type" ariaLabel="Opportunity type" allLabel="All types" value={search.type} options={types.map(type => ({ value: type, label: humanize(type) }))} onValueChange={type => { void update({ type }); }} />
      <ListFilterSelect label="Field" allLabel="All fields" value={search.field} options={fields.map(f => ({ value: f.slug, label: f.name }))} onValueChange={field => { void update({ field }); }} />
      <ListFilterSelect label="Stage" allLabel="All stages" value={search.stage} options={stages.map(f => ({ value: f.slug, label: f.name }))} onValueChange={stage => { void update({ stage }); }} />
      {hasFilters && <Button variant="ghost" className="nb-btn nb-btn-quiet" onClick={() => update({ type: '', field: '', stage: '' })}>Clear filters</Button>}
    </div>
    <p className="nb-small my-6 text-muted-foreground" role="status">{opportunities.length} {search.archive ? 'closed' : 'open'} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}</p>
    {search.archive ? opportunities.length > 0 && <CardGrid>{opportunities.map(o => <OpportunityCard key={o.id} opportunity={o} now={data.now} />)}</CardGrid> : <>
      {open.dated.length > 0 && <section className="mt-4" aria-labelledby="deadline-coming"><h2 id="deadline-coming" className="nb-h2 mb-6">Deadline coming</h2><CardGrid>{open.dated.map(o => <OpportunityCard key={o.id} opportunity={o} now={data.now} />)}</CardGrid></section>}
      {open.rolling.length > 0 && <section className="mt-16" aria-labelledby="open-all-year"><h2 id="open-all-year" className="nb-h2 mb-6">Open all year</h2><CardGrid>{open.rolling.map(o => <OpportunityCard key={o.id} opportunity={o} now={data.now} />)}</CardGrid></section>}
      {open.announced.length > 0 && <section className="mt-16" aria-labelledby="next-call"><h2 id="next-call" className="nb-h2 mb-6">Next call to be announced</h2><CardGrid>{open.announced.map(o => <OpportunityCard key={o.id} opportunity={o} now={data.now} />)}</CardGrid></section>}
    </>}
    {opportunities.length === 0 && <div className="py-12">
      <h2 className="nb-h3">{search.archive ? 'No closed opportunities found' : 'No open opportunities found'}</h2>
      <p className="nb-body mt-3 text-muted-foreground">{hasFilters ? 'No opportunities match these filters.' : 'We’re adding opportunities. Check back soon.'}</p>
    </div>}
  </div>;
}
