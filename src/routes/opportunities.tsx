import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { OPP_TYPES, humanize } from '@/lib/admin/entities';
import { opportunitiesQuery } from '@/lib/opportunities.query';
import { compactSearch } from '@/lib/search-params';
import { amountLabel, deadlineLabel, filterOpportunities } from '@/lib/opportunities';

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
    { title: 'Opportunities — Northbeat' },
    { name: 'description', content: 'Programme intakes, grant calls, competitions and jobs in Nordic health innovation, sorted by nearest deadline.' },
    { property: 'og:title', content: 'Opportunities — Northbeat' },
    { property: 'og:description', content: 'Programme intakes, grant calls, competitions and jobs in Nordic health innovation, sorted by nearest deadline.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: '/opportunities' },
    { name: 'twitter:card', content: 'summary' },
  ], links: [{ rel: 'canonical', href: '/opportunities' }] }),
  component: Opportunities,
  errorComponent: ({ reset }) => { const client = useQueryClient(); return <div className="nb-container nb-section"><h1 className="nb-h2">Opportunities couldn’t be loaded</h1><p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await client.resetQueries({ queryKey: ['public-opportunities'] }); reset(); }}>Try again</Button></div>; },
  notFoundComponent: () => <div className="nb-container nb-section"><h1 className="nb-h2">Opportunities not found</h1></div>,
});

function Opportunities() {
  const { data } = useSuspenseQuery(opportunitiesQuery);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/opportunities' });
  const filters = { type: search.type, field: search.field, stage: search.stage, archive: search.archive };
  const opportunities = filterOpportunities(data, filters);
  const has = (patch: Partial<typeof filters>) => filterOpportunities(data, { ...filters, ...patch }).length > 0;
  const types = OPP_TYPES.filter((type) => has({ type }));
  const fields = data.terms.filter((term) => term.kind === 'field' && has({ field: term.slug }));
  const stages = data.terms.filter((term) => term.kind === 'stage' && has({ stage: term.slug }));
  const update = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const hasFilters = search.type || search.field || search.stage;

  return <div className="nb-container nb-section">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div><p className="nb-eyebrow mb-3">Nordic health innovation</p><h1 className="nb-h1">Opportunities</h1></div>
      <div className="flex gap-2" aria-label="Opportunity period">
        <Button variant="ghost" className={`nb-btn ${!search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={!search.archive} onClick={() => update({ archive: false })}>Open</Button>
        <Button variant="ghost" className={`nb-btn ${search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={search.archive} onClick={() => update({ archive: true })}>Closed</Button>
      </div>
    </header>
    <div className="flex flex-wrap items-end gap-4 border-b border-hairline pb-6">
      <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">Type</span>
        <select aria-label="Opportunity type" className="nb-input" value={search.type} onChange={(e) => update({ type: e.target.value })}>
          <option value="">All types</option>
          {types.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
          {search.type && !OPP_TYPES.some((type) => type === search.type) && <option value={search.type}>{humanize(search.type)}</option>}
        </select></label>
      <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">Field</span>
        <select aria-label="Field" className="nb-input" value={search.field} onChange={(e) => update({ field: e.target.value })}>
          <option value="">All fields</option>
          {fields.map((term) => <option key={term.id} value={term.slug}>{term.name}</option>)}
          {search.field && !fields.some((term) => term.slug === search.field) && <option value={search.field}>{humanize(search.field)}</option>}
        </select></label>
      <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">Stage</span>
        <select aria-label="Stage" className="nb-input" value={search.stage} onChange={(e) => update({ stage: e.target.value })}>
          <option value="">All stages</option>
          {stages.map((term) => <option key={term.id} value={term.slug}>{term.name}</option>)}
          {search.stage && !stages.some((term) => term.slug === search.stage) && <option value={search.stage}>{humanize(search.stage)}</option>}
        </select></label>
      {hasFilters && <Button variant="ghost" className="nb-btn nb-btn-quiet" onClick={() => update({ type: '', field: '', stage: '' })}>Clear filters</Button>}
    </div>
    <p className="nb-small my-6 text-muted-foreground" role="status">{opportunities.length} {search.archive ? 'closed' : 'open'} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}{!search.archive && opportunities.length > 0 ? ' · nearest deadline first' : ''}</p>
    {opportunities.length > 0 && <ul className="space-y-4">
      {opportunities.map((opportunity) => {
        const amount = amountLabel(opportunity);
        const job = opportunity.type === 'job';
        return <li key={opportunity.id} className="nb-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="nb-eyebrow">{humanize(opportunity.type)}</p>
            <p className="nb-small text-muted-foreground">{deadlineLabel(opportunity, data.now)}</p>
          </div>
          <h2 className="nb-h3 mt-2"><Link to="/opportunity/$slug" params={{ slug: opportunity.slug }} className="nb-org-link break-words">{opportunity.title}</Link></h2>
          {opportunity.summary && <p className="nb-body mt-2 text-muted-foreground">{opportunity.summary}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {amount && <span className="nb-chip">{amount}</span>}
            {job && opportunity.location && <span className="nb-chip">{opportunity.location}{opportunity.remote_ok ? ' · remote OK' : ''}</span>}
            {job && opportunity.employment_type && <span className="nb-chip">{humanize(opportunity.employment_type)}</span>}
          </div>
        </li>;
      })}
    </ul>}
    {opportunities.length === 0 && <div className="py-12">
      <h2 className="nb-h3">{search.archive ? 'No closed opportunities found' : 'No open opportunities found'}</h2>
      <p className="nb-body mt-3 text-muted-foreground">{hasFilters ? 'No published opportunities match these filters.' : 'Published opportunities will appear here.'}</p>
    </div>}
  </div>;
}
