import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { directoryQuery } from '@/lib/directory.query';
import { eventsQuery } from '@/lib/events.query';
import { opportunitiesQuery } from '@/lib/opportunities.query';
import { learnHubQuery } from '@/lib/learn.query';
import { AUDIENCE_COPY, CALL_TYPES, ORG_SECTIONS, isAudience, openCalls, orgsOfTypes, upcomingEvents, type Audience } from '@/lib/start';
import { CardGrid } from '@/components/site/EntryCard';
import { OrganisationCard } from '@/components/site/OrganisationCard';
import { OpportunityCard, EventRowItem } from '@/components/site/ListItems';

const SITE = 'https://nordic-heartbeat.lovable.app';
const LIMIT = 6;

export const Route = createFileRoute('/start/$audience')({
  loader: async ({ context, params }) => {
    if (!isAudience(params.audience)) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(directoryQuery),
      context.queryClient.ensureQueryData(eventsQuery),
      context.queryClient.ensureQueryData(opportunitiesQuery),
      context.queryClient.ensureQueryData(learnHubQuery),
    ]);
    return { audience: params.audience };
  },
  head: ({ params }) => {
    const copy = isAudience(params.audience) ? AUDIENCE_COPY[params.audience] : null;
    const title = copy ? `${copy.title}: Northbeat` : 'Not found: Northbeat';
    const url = `${SITE}/start/${encodeURIComponent(params.audience)}`;
    return {
      meta: [
        { title }, { name: 'description', content: copy?.lead ?? 'Page not found.' },
        { property: 'og:title', content: title }, { property: 'og:description', content: copy?.lead ?? 'Page not found.' },
        { property: 'og:type', content: 'website' }, { property: 'og:url', content: url }, { name: 'twitter:card', content: 'summary' },
        ...(!copy ? [{ name: 'robots', content: 'noindex' }] : []),
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
  component: StartPage,
  errorComponent: () => <div role="alert" className="nb-container nb-section"><h1 className="nb-h2">This page didn't load</h1><p className="nb-body mt-4">Please try again in a moment.</p></div>,
  notFoundComponent: () => <div className="nb-container nb-section"><h1 className="nb-h2">This page has no pulse.</h1><p className="nb-body mt-4"><Link to="/" className="nb-link">Go to the homepage</Link></p></div>,
});

function Section({ heading, more, children }: { heading: string; more?: React.ReactNode; children: React.ReactNode }) {
  return <section className="nb-start-page-section" aria-label={heading}>
    <div className="nb-start-page-heading"><h2 className="nb-h2">{heading}</h2>{more}</div>
    {children}
  </section>;
}

function StartPage() {
  const { audience } = Route.useLoaderData() as { audience: Audience };
  const { data: dir } = useSuspenseQuery(directoryQuery);
  const { data: ev } = useSuspenseQuery(eventsQuery);
  const { data: opp } = useSuspenseQuery(opportunitiesQuery);
  const { data: learn } = useSuspenseQuery(learnHubQuery);
  const copy = AUDIENCE_COPY[audience];
  const calls = openCalls(opp.opportunities, CALL_TYPES[audience], opp.now).slice(0, LIMIT);
  const events = upcomingEvents(ev.events, ev.now).slice(0, LIMIT);
  const steps = audience === 'student' ? learn.steps.filter(s => s.guides.length > 0) : [];
  return <div className="nb-container nb-section">
    <header className="mb-8">
      <h1 className="nb-h1">{copy.title}</h1>
      <p className="nb-lead mt-4 max-w-2xl">{copy.lead}</p>
    </header>
    {steps.length > 0 && <Section heading="The Learn journey" more={<Link to="/learn" search={{}} className="nb-link">All of Learn</Link>}>
      <ol className="nb-start-steps">{steps.map((s, i) => <li key={s.id}><Link to="/learn" search={{ step: s.slug }} className="nb-start-step"><span className="nb-start-step-n">{i + 1}</span><span className="nb-h3">{s.name}</span><span className="nb-small text-muted-foreground">{s.guides.length} {s.guides.length === 1 ? 'guide' : 'guides'}</span></Link></li>)}</ol>
    </Section>}
    {calls.length > 0 && <Section heading={audience === 'researcher' ? 'Research grants' : 'Funding calls by deadline'} more={<Link to="/opportunities" className="nb-link">All opportunities</Link>}>
      <CardGrid>{calls.map(o => <OpportunityCard key={o.id} opportunity={o} now={opp.now} />)}</CardGrid>
    </Section>}
    {ORG_SECTIONS[audience].map(section => {
      const orgs = orgsOfTypes(dir.organisations, section.types);
      if (!orgs.length) return null;
      return <Section key={section.heading} heading={section.heading} more={orgs.length > LIMIT ? <Link to="/explore" search={{ type: section.types }} className="nb-link">See all {orgs.length}</Link> : undefined}>
        <CardGrid>{orgs.slice(0, LIMIT).map(o => <OrganisationCard key={o.id} organisation={o} terms={dir.terms} />)}</CardGrid>
      </Section>;
    })}
    {events.length > 0 && <Section heading="Events" more={<Link to="/events" className="nb-link">All events</Link>}>
      <ul>{events.map(e => <EventRowItem key={e.id} event={e} now={ev.now} />)}</ul>
    </Section>}
  </div>;
}
