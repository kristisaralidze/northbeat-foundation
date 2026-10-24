import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { HubList, LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { learnHubQuery } from '@/lib/learn.query';
import { levelLabel, readingLabel, type JourneyStep } from '@/lib/learn';
import { useEffect, useRef, useState } from 'react';

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
  const journeyRef = useRef<HTMLElement>(null);
  const [scrollStep, setScrollStep] = useState(0);
  useEffect(() => {
    const el = journeyRef.current; if (!el) return;
    const update = (event: Event) => setScrollStep((event as CustomEvent<number>).detail);
    el.addEventListener('northbeat:journey-step', update);
    return () => el.removeEventListener('northbeat:journey-step', update);
  }, []);
  const { data } = useSuspenseQuery(learnHubQuery);
  const { step: stepSlug } = Route.useSearch();
  const active = data.steps.find((s) => s.slug === stepSlug && hasContent(s));
  const areas = data.areas.filter((a) => a.guides.length);

  return <div className="nb-container nb-section">
    <header className="max-w-2xl">
      <h1 className="nb-h1">Learn</h1>
      <p className="nb-lead mt-6">Plain guides for building a health venture in the Nordics, step by step.</p>
    </header>

    {data.steps.length > 0 && <section ref={journeyRef} data-journey className="mt-12" aria-labelledby="journey">
      <p data-journey-current className="nb-journey-current">{scrollStep + 1} / {data.steps.length}: {data.steps[scrollStep]?.name}</p>
      <h2 id="journey" className="nb-h2">The founder journey</h2>
      <p className="nb-body mt-3 max-w-2xl text-muted-foreground">Eight steps from curious to growing. Pick one to see its guides and who can help.</p>
      <ol className="nb-learn-steps mt-8">
        {data.steps.map((s, i) => {
          const open = active?.id === s.id;
          const usable = hasContent(s);
          const body = <><span className="nb-learn-step-number" aria-hidden="true">{i + 1}</span><span className="nb-learn-step-name">{s.name}</span>{s.guides.length > 0 && <span className="nb-small text-muted-foreground">{s.guides.length} {s.guides.length === 1 ? 'guide' : 'guides'}</span>}</>;
          return <li key={s.id} data-journey-step data-lit={i <= scrollStep} data-step-name={s.name}>
            {usable
              ? <Link to="/learn" search={open ? {} : { step: s.slug }} resetScroll={false} aria-expanded={open} aria-controls="journey-panel" data-current={open} className="nb-learn-step">{body}</Link>
              : <span className="nb-learn-step" data-disabled="true">{body}</span>}
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
      <h2 id="areas" className="nb-h2">Browse by area</h2>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => <li key={a.id} className="nb-card flex flex-col gap-3">
          <h3 className="nb-h3">{a.name}</h3>
          <p className="nb-small text-muted-foreground">{[`${a.guides.length} ${a.guides.length === 1 ? 'guide' : 'guides'}`, readingLabel(a.guides.reduce((n, g) => n + (g.reading_minutes ?? 0), 0))].filter(Boolean).join(', ')}</p>
          <ul className="space-y-2">
            {a.guides.map((g) => <li key={g.id}><Link to="/learn/$slug" params={{ slug: g.slug }} className="nb-link nb-small">{g.title}</Link>
              <span className="nb-small text-muted-foreground">, {[levelLabel(g.level), readingLabel(g.reading_minutes)].filter(Boolean).join(', ')}</span></li>)}
          </ul>
        </li>)}
      </ul>
    </section>}

    {data.glossaryCount > 0 && <section className="mt-16 border-t border-hairline pt-10" aria-labelledby="glossary-teaser">
      <h2 id="glossary-teaser" className="nb-h2">New to the words?</h2>
      {Boolean(data.glossaryPreview?.length) && <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.glossaryPreview!.map((t) => <div key={t.slug}><dt className="nb-h3">{t.term}</dt><dd className="nb-small mt-2 text-muted-foreground">{t.short_definition}</dd></div>)}
      </dl>}
      <Link to="/learn/glossary" className="nb-btn nb-btn-secondary mt-8">See all {data.glossaryCount} terms</Link>
    </section>}
  </div>;
}
