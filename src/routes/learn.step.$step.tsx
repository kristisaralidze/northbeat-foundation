import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { journeyStepQuery } from '@/lib/learn.query';
import { EMPTY_SEARCH } from '@/lib/explore';
import { dateLabel } from '@/lib/events';

export const Route = createFileRoute('/learn/step/$step')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(journeyStepQuery(params.step)),
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.step.name}: Learn: Northbeat` : 'Learn: Northbeat';
    const description = loaderData?.guide?.one_sentence ?? 'One step of the Nordic health founder journey, in plain language.';
    return {
      meta: [
        { title }, { name: 'description', content: description },
        { property: 'og:title', content: title }, { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' }, { name: 'twitter:card', content: 'summary' },
      ],
    };
  },
  component: StepPage,
  errorComponent: LearnError,
  notFoundComponent: LearnNotFound,
});

function StepPage() {
  const { step } = Route.useParams();
  const { data } = useSuspenseQuery(journeyStepQuery(step));

  return <div className="nb-container nb-section">
    <div className="mb-8"><Link to="/learn" className="nb-link">Learn</Link></div>
    <header className="max-w-2xl">
      <p className="nb-small text-muted-foreground">Step {data.number} of {data.total}</p>
      <h1 className="nb-h1 mt-3">{data.step.name}</h1>
    </header>

    {data.guide && <section className="nb-detail-section" aria-labelledby="what-you-do">
      <h2 id="what-you-do" className="nb-h2 mb-5">What you do</h2>
      <h3 className="nb-h3"><Link to="/learn/$slug" params={{ slug: data.guide.slug }} className="nb-link">{data.guide.title}</Link></h3>
      {data.guide.one_sentence && <p className="nb-body mt-3 max-w-2xl">{data.guide.one_sentence}</p>}
    </section>}

    {data.commonMistakes.length > 0 && <section className="nb-detail-section" aria-labelledby="common-mistakes">
      <h2 id="common-mistakes" className="nb-h2 mb-5">Common mistakes</h2>
      <ul className="nb-check-list nb-body max-w-2xl">{data.commonMistakes.map((m) => <li key={m}>{m}</li>)}</ul>
    </section>}

    {data.picks.length > 0 && <section className="nb-detail-section" aria-labelledby="go-here">
      <h2 id="go-here" className="nb-h2 mb-6">Go here</h2>
      <ul className="space-y-5 max-w-2xl">
        {data.picks.map((p) => <li key={p.slug}>
          <h3 className="nb-h3"><Link to="/org/$slug" params={{ slug: p.slug }} className="nb-link">{p.title}</Link></h3>
          {p.reason && <p className="nb-small mt-1 text-muted-foreground">{p.reason}</p>}
        </li>)}
      </ul>
      <Link to="/explore" search={EMPTY_SEARCH} className="nb-link nb-small mt-6 inline-block">See all in Explore</Link>
    </section>}

    {data.opportunities.length > 0 && <section className="nb-detail-section" aria-labelledby="open-now">
      <h2 id="open-now" className="nb-h2 mb-6">Open now for this step</h2>
      <ul className="space-y-5 max-w-2xl">
        {data.opportunities.map((o) => <li key={o.slug}>
          <h3 className="nb-h3"><Link to="/opportunity/$slug" params={{ slug: o.slug }} className="nb-link">{o.title}</Link></h3>
          {o.summary && <p className="nb-small mt-1 text-muted-foreground">{o.summary}</p>}
        </li>)}
      </ul>
    </section>}

    <nav className="nb-detail-section flex flex-wrap gap-6" aria-label="More steps">
      {data.previous && <Link to="/learn/step/$step" params={{ step: data.previous.slug }} className="nb-link">Previous: {data.previous.name}</Link>}
      {data.next && <Link to="/learn/step/$step" params={{ step: data.next.slug }} className="nb-link">Next: {data.next.name}</Link>}
    </nav>
  </div>;
}

void dateLabel;
