import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PulseLine } from '@/components/site/PulseLine';
import { HubList, LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { learnHubQuery } from '@/lib/learn.query';
import { levelLabel, readingLabel, type JourneyStep } from '@/lib/learn';

const TITLE = 'Learn: Northbeat';
const DESC = 'Plain guides for building a health venture in the Nordics, step by step, from first idea to growth.';

export const Route = createFileRoute('/learn/')({
  validateSearch: (search: Record<string, unknown>): { step?: string } => (typeof search['step'] === 'string' && search['step'] ? { step: search['step'] } : {}),
  loader: ({ context }) => context.queryClient.ensureQueryData(learnHubQuery),
  head: () => ({
    meta: [
      { title: TITLE }, { name: 'description', content: DESC },
      { property: 'og:title', content: TITLE }, { property: 'og:description', content: DESC },
      { property: 'og:type', content: 'website' }, { property: 'og:url', content: 'https://nordic-heartbeat.lovable.app/learn' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://nordic-heartbeat.lovable.app/learn' }],
  }),
  component: Learn,
  errorComponent: LearnError,
  notFoundComponent: LearnNotFound,
});

const hasContent = (s: JourneyStep) => s.guides.length + s.organisations.length + s.opportunities.length + s.events.length > 0;

function Learn() {
  const { data } = useSuspenseQuery(learnHubQuery);
  const { step: stepSlug } = Route.useSearch();
  const active = data.steps.find((s) => s.slug === stepSlug && hasContent(s));
  const areas = data.areas.filter((a) => a.guides.length);

  return <div className="nb-container nb-section">
    <header className="max-w-2xl">
      <p className="nb-eyebrow mb-3">Start here</p>
      <h1 className="nb-h1">Learn</h1>
      <div className="nb-lead mt-6 space-y-3">
        <p>Health innovation is any new way to prevent, find, treat or care for illness, or to keep people well.</p>
        <p>It can be a device, a medicine, an app, a service or a better care pathway. Technology is one way to do it, not the only one.</p>
        <p>These guides walk you through it in order, and point to the people and programmes in the Nordics who can help.</p>
      </div>
    </header>

    {data.steps.length > 0 && <section className="mt-16" aria-labelledby="journey">
      <h2 id="journey" className="nb-h2">The founder journey</h2>
      <p className="nb-body mt-3 max-w-2xl text-muted-foreground">Eight steps from curious to growing. Pick one to see its guides and who can help.</p>
      <ol className="mt-8 flex flex-col md:flex-row">
        {data.steps.map((s, i) => {
          const open = active?.id === s.id;
          const usable = hasContent(s);
          const dot = <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border nb-small font-medium ${open ? 'border-primary bg-primary text-primary-foreground' : usable ? 'border-primary text-berry' : 'border-hairline text-muted-foreground'}`}>{i + 1}</span>;
          return <li key={s.id} className="relative flex flex-1 md:flex-col">
            <span aria-hidden className={`absolute bg-hairline ${i === data.steps.length - 1 ? 'hidden' : ''} left-[18px] top-9 h-[calc(100%-2.25rem)] w-px md:left-9 md:top-[18px] md:h-px md:w-[calc(100%-2.25rem)]`} />
            {usable
              ? <Link to="/learn" search={open ? {} : { step: s.slug }} resetScroll={false} aria-expanded={open} aria-controls="journey-panel"
                  className="group flex items-center gap-3 rounded-lg py-2 pr-2 md:flex-col md:items-start">
                  {dot}<span className={`nb-body group-hover:text-berry ${open ? 'font-medium text-berry' : 'text-ink'}`}>{s.name}</span></Link>
              : <span className="flex items-center gap-3 py-2 pr-2 md:flex-col md:items-start">{dot}<span className="nb-body text-muted-foreground">{s.name}</span></span>}
          </li>;
        })}
      </ol>
      {active && <div id="journey-panel" className="nb-card-frost mt-8 space-y-8" role="region" aria-label={active.name}>
        <h3 className="nb-h3">{active.name}</h3>
        {active.guides.length > 0 && <section>
          <h4 className="nb-eyebrow mb-3">Guides</h4>
          <ul className="grid gap-4 sm:grid-cols-2">
            {active.guides.map((g) => <li key={g.id}>
              <Link to="/learn/$slug" params={{ slug: g.slug }} className="nb-org-link nb-body font-medium">{g.title}</Link>
              {g.one_sentence && <p className="nb-small mt-1 text-muted-foreground">{g.one_sentence}</p>}
            </li>)}
          </ul>
        </section>}
        <div className="grid gap-8 md:grid-cols-3">
          <HubList title="Organisations" kind="organisations" items={active.organisations} />
          <HubList title="Opportunities" kind="opportunities" items={active.opportunities} />
          <HubList title="Events" kind="events" items={active.events} />
        </div>
      </div>}
    </section>}

    {areas.length > 0 && <section className="mt-16" aria-labelledby="areas">
      <PulseLine className="mb-10" />
      <h2 id="areas" className="nb-h2">Browse by area</h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => <li key={a.id} className="nb-card flex flex-col gap-3">
          <h3 className="nb-h3">{a.name}</h3>
          <p className="nb-small text-muted-foreground">{a.guides.length} {a.guides.length === 1 ? 'guide' : 'guides'}</p>
          <ul className="space-y-2">
            {a.guides.map((g) => <li key={g.id}><Link to="/learn/$slug" params={{ slug: g.slug }} className="nb-link nb-small">{g.title}</Link>
              <span className="nb-small text-muted-foreground"> · {[levelLabel(g.level), readingLabel(g.reading_minutes)].filter(Boolean).join(' · ')}</span></li>)}
          </ul>
        </li>)}
      </ul>
    </section>}

    {data.glossaryCount > 0 && <section className="mt-16 border-t border-hairline pt-10">
      <h2 className="nb-h3">New to the words?</h2>
      <p className="nb-body mt-2 text-muted-foreground">{data.glossaryCount} terms explained in plain language.</p>
      <Link to="/learn/glossary" className="nb-btn nb-btn-secondary mt-5">Open the glossary</Link>
    </section>}
  </div>;
}
