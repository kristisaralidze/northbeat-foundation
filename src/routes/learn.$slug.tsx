import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { HubList, LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { guideQuery } from '@/lib/learn.query';
import { levelLabel, paragraphs, readingLabel } from '@/lib/learn';
import { dateLabel } from '@/lib/events';

export const Route = createFileRoute('/learn/$slug')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(guideQuery(params.slug)),
  head: ({ loaderData, params }) => {
    const url = `https://nordic-heartbeat.lovable.app/learn/${encodeURIComponent(params.slug)}`;
    const title = loaderData ? `${loaderData.guide.title}: Northbeat Learn` : 'Guide unavailable: Northbeat';
    const desc = loaderData?.guide.one_sentence ?? loaderData?.guide.summary ?? 'A Northbeat guide to building a health venture in the Nordics.';
    return {
      meta: [
        { title }, { name: 'description', content: desc },
        { property: 'og:title', content: title }, { property: 'og:description', content: desc },
        { property: 'og:type', content: 'article' }, { property: 'og:url', content: url },
        { name: 'twitter:card', content: 'summary' },
        ...(loaderData ? [] : [{ name: 'robots', content: 'noindex' }]),
      ],
      links: [{ rel: 'canonical', href: url }],
    };
  },
  component: Guide,
  errorComponent: LearnError,
  notFoundComponent: LearnNotFound,
});

function Guide() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(guideQuery(slug));
  const { guide, area, step, sources, organisations, opportunities, events, previous, next } = data;
  const meta = [levelLabel(guide.level), readingLabel(guide.reading_minutes), area?.name, step?.name].filter(Boolean);
  const body = paragraphs(guide.body);

  return <article className="nb-container nb-section">
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="nb-small mb-6"><Link to="/learn" className="nb-link">Learn</Link></nav>
      <h1 className="nb-h1">{guide.title}</h1>
      <p className="nb-small mt-4 text-muted-foreground">{meta.join(' · ')}</p>
      {guide.one_sentence && <div className="mt-8 border-l-2 border-primary pl-5">
        <p className="nb-eyebrow mb-2">In one sentence</p>
        <p className="nb-lead text-ink">{guide.one_sentence}</p>
      </div>}
      {body.length > 0 && <div className="nb-body mt-10 space-y-5 text-ink">{body.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>}
      {guide.next_step && <aside className="nb-card-frost mt-12">
        <p className="nb-eyebrow mb-2">Your next step</p>
        <p className="nb-body text-ink whitespace-pre-line">{guide.next_step}</p>
      </aside>}
      {(organisations.length > 0 || opportunities.length > 0 || events.length > 0) && <section className="mt-14" aria-labelledby="in-hub">
        <h2 id="in-hub" className="nb-h3 mb-6">In the hub</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <HubList title="Organisations" kind="organisations" items={organisations} />
          <HubList title="Opportunities" kind="opportunities" items={opportunities} />
          <HubList title="Events" kind="events" items={events} />
        </div>
      </section>}
      {sources.length > 0 && <section className="mt-14">
        <h2 className="nb-eyebrow mb-3">Sources</h2>
        <ul className="space-y-2">{sources.map((s) => <li key={s.url} className="nb-small"><a href={s.url} target="_blank" rel="noopener noreferrer" className="nb-link">{s.title}</a></li>)}</ul>
      </section>}
      {(guide.last_checked || guide.reviewed_by) && <p className="nb-small mt-10 border-t border-hairline pt-6 text-muted-foreground">
        {guide.last_checked && <>Last checked {dateLabel(guide.last_checked)}.</>}{guide.last_checked && guide.reviewed_by && ' '}{guide.reviewed_by && <>Reviewed by {guide.reviewed_by}.</>}
      </p>}
      {(previous || next) && <nav aria-label={area ? `More in ${area.name}` : 'More guides'} className="mt-12 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-2">
        {previous ? <Link to="/learn/$slug" params={{ slug: previous.slug }} className="group"><span className="nb-eyebrow">Previous</span><span className="nb-body mt-1 block text-ink group-hover:text-berry">{previous.title}</span></Link> : <span />}
        {next && <Link to="/learn/$slug" params={{ slug: next.slug }} className="group sm:text-right"><span className="nb-eyebrow">Next</span><span className="nb-body mt-1 block text-ink group-hover:text-berry">{next.title}</span></Link>}
      </nav>}
    </div>
  </article>;
}
