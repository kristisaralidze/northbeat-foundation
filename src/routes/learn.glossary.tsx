import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { LearnError, LearnNotFound } from '@/components/site/LearnParts';
import { glossaryQuery } from '@/lib/learn.query';
import { groupGlossary } from '@/lib/learn';

const TITLE = 'Glossary: Northbeat Learn';
const DESC = 'Health innovation and startup terms explained in plain language, A to Z.';

export const Route = createFileRoute('/learn/glossary')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => (typeof search.q === 'string' && search.q ? { q: search.q } : {}),
  loader: ({ context }) => context.queryClient.ensureQueryData(glossaryQuery),
  head: () => ({
    meta: [
      { title: TITLE }, { name: 'description', content: DESC },
      { property: 'og:title', content: TITLE }, { property: 'og:description', content: DESC },
      { property: 'og:type', content: 'website' }, { property: 'og:url', content: 'https://nordic-heartbeat.lovable.app/learn/glossary' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: 'https://nordic-heartbeat.lovable.app/learn/glossary' }],
  }),
  component: Glossary,
  errorComponent: LearnError,
  notFoundComponent: LearnNotFound,
});

function Glossary() {
  const { data } = useSuspenseQuery(glossaryQuery);
  const { q = '' } = Route.useSearch();
  const navigate = useNavigate({ from: '/learn/glossary' });
  const groups = groupGlossary(data, q);
  const count = groups.reduce((n, g) => n + g.terms.length, 0);

  return <div className="nb-container nb-section">
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="nb-small mb-6"><Link to="/learn" className="nb-link">Learn</Link></nav>
      <h1 className="nb-h1">Glossary</h1>
      <p className="nb-lead mt-4">The words you'll hear when building in health, in plain language.</p>
      {data.length === 0 ? <p className="nb-body mt-10 text-muted-foreground">The first terms are on their way.</p> : <>
        <label htmlFor="glossary-search" className="sr-only">Search the glossary</label>
        <input id="glossary-search" type="search" className="nb-input mt-8" placeholder="Search terms" value={q}
          onChange={(e) => navigate({ search: e.target.value ? { q: e.target.value } : {}, replace: true, resetScroll: false })} />
        {groups.length > 1 && <nav aria-label="Letters" className="mt-6 flex flex-wrap gap-2">
          {groups.map((g) => <a key={g.letter} href={`#letter-${g.letter}`} className="nb-chip">{g.letter}</a>)}
        </nav>}
        <p className="nb-small mt-6 text-muted-foreground" role="status">{count} {count === 1 ? 'term' : 'terms'}</p>
        {groups.map((g) => <section key={g.letter} id={`letter-${g.letter}`} className="mt-10 scroll-mt-24">
          <h2 className="nb-h2 text-berry">{g.letter}</h2>
          <dl className="mt-4 divide-y divide-hairline border-t border-hairline">
            {g.terms.map((t) => <div key={t.id} id={t.slug} className="scroll-mt-24 py-5">
              <dt className="nb-h3"><a href={`#${t.slug}`} className="nb-org-link">{t.term}</a></dt>
              <dd className="nb-body mt-2 text-ink">{t.short_definition}</dd>
              {t.explanation && <dd className="nb-small mt-3 whitespace-pre-line text-muted-foreground">{t.explanation}</dd>}
              {t.related.length > 0 && <dd className="nb-small mt-3">See also: {t.related.map((r, i) => <span key={r.slug}>{i > 0 && ', '}<a href={`#${r.slug}`} onClick={() => q && navigate({ search: {}, hash: r.slug })} className="nb-link">{r.term}</a></span>)}</dd>}
              {t.guides.length > 0 && <dd className="nb-small mt-2">Read: {t.guides.map((r, i) => <span key={r.slug}>{i > 0 && ', '}<Link to="/learn/$slug" params={{ slug: r.slug }} className="nb-link">{r.title}</Link></span>)}</dd>}
            </div>)}
          </dl>
        </section>)}
        {count === 0 && <p className="nb-body mt-6 text-muted-foreground">No terms match “{q}”.</p>}
      </>}
    </div>
  </div>;
}
