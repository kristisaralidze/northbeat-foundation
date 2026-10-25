import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { learnHubQuery } from '@/lib/learn.query';
import { LearnJourney } from '@/components/site/LearnJourney';

const TITLE = 'Learn: Northbeat';
const DESC = 'Plain playbooks for building health in the Nordics, step by step, from first idea to growth.';

export const Route = createFileRoute('/learn/')({
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

/** One small heartbeat beat on the journey line. */
function Beat() {
  return <svg className="nb-journey-beat" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M1 12h6l3-8 4 16 3-8h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Learn() {
  const { data } = useSuspenseQuery(learnHubQuery);

  return <div className="nb-container nb-section">
    <header className="max-w-2xl">
      <h1 className="nb-h1">Learn</h1>
      <p className="nb-lead mt-6">Plain playbooks for building health in the Nordics.</p>
    </header>

    {data.steps.length > 0 && <nav className="mt-16" aria-label="The founder journey">
      <LearnJourney>
        {data.steps.map((s, i) => {
          const line = s.guides[0]?.one_sentence ?? null;
          return <li key={s.id} className="nb-journey-stop">
            <Link to="/learn/step/$step" params={{ step: s.slug }} className="nb-journey-link" aria-label={`Step ${i + 1}: ${s.name}`}>
              <Beat />
              <span className="nb-journey-number" aria-hidden="true">{i + 1}</span>
              <span className="nb-journey-name">{s.name}</span>
              {line && <span className="nb-journey-text">{line}</span>}
            </Link>
          </li>;
        })}
      </LearnJourney>
    </nav>}

    {data.glossaryCount > 0 && <section className="mt-20" aria-labelledby="glossary-teaser">
      <h2 id="glossary-teaser" className="nb-h2">New to the words?</h2>
      {Boolean(data.glossaryPreview?.length) && <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.glossaryPreview?.map((t) => <div key={t.slug}><dt className="nb-h3">{t.term}</dt><dd className="nb-small mt-2 text-muted-foreground">{t.short_definition}</dd></div>)}
      </dl>}
      <Link to="/learn/glossary" className="nb-btn nb-btn-secondary mt-8">See all {data.glossaryCount} terms</Link>
    </section>}
  </div>;
}
