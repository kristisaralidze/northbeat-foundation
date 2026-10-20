import { trialPhase, trialStatus, type NewsItem, type Research } from '@/lib/enrich';
import { dateLabel } from '@/lib/events';

const fmt = new Intl.NumberFormat('en-GB');
export function asResearch(v: unknown): Research | null {
  const r = v as Research | null;
  return r && typeof r === 'object' && typeof r.works_count === 'number' && Array.isArray(r.counts_by_year) ? r : null;
}

export function ResearchSection({ research }: { research: Research }) {
  const max = Math.max(1, ...research.counts_by_year.map(y => y.works));
  return <section className="nb-detail-section">
    <h2 className="nb-h2 mb-6">Research</h2>
    <dl className="nb-research-numbers"><div><dd>{fmt.format(research.works_count)}</dd><dt>Publications</dt></div><div><dd>{fmt.format(research.cited_by_count)}</dd><dt>Citations</dt></div></dl>
    <figure className="mt-8">
      <figcaption className="nb-small text-muted-foreground mb-3">Publications per year</figcaption>
      <div className="nb-research-bars" role="img" aria-label={research.counts_by_year.map(y => `${y.year}: ${y.works}`).join(', ')}>
        {research.counts_by_year.map(y => <div key={y.year} className="nb-research-bar"><span style={{ height: `${Math.max(2, (y.works / max) * 100)}%` }} title={`${y.year}: ${fmt.format(y.works)}`} /><small>{String(y.year).slice(2)}</small></div>)}
      </div>
    </figure>
    {research.topics.length > 0 && <ul className="nb-research-topics mt-6">{research.topics.map(t => <li key={t}>{t}</li>)}</ul>}
    <p className="nb-small text-muted-foreground mt-5">Data: <a className="nb-link" href="https://openalex.org" target="_blank" rel="noopener noreferrer">OpenAlex</a></p>
  </section>;
}

type TrialRow = { nct_id: string; title: string; status: string | null; phase: string | null; start_date: string | null };
export function TrialsSection({ trials }: { trials: TrialRow[] }) {
  if (!trials.length) return null;
  return <section className="nb-detail-section">
    <h2 className="nb-h2 mb-6">Clinical trials</h2>
    <ul className="nb-trial-list">{trials.map(t => <li key={t.nct_id}>
      <div className="min-w-0"><h3 className="nb-h3"><a className="nb-link" href={`https://clinicaltrials.gov/study/${t.nct_id}`} target="_blank" rel="noopener noreferrer">{t.title}</a></h3>
        <p className="nb-small text-muted-foreground mt-2">{[trialPhase(t.phase), t.start_date ? `Started ${t.start_date.slice(0, 4)}` : null].filter(Boolean).join(', ')}</p></div>
      {t.status && <span className={`nb-trial-status${t.status === 'RECRUITING' ? ' is-recruiting' : t.status === 'COMPLETED' ? ' is-completed' : ''}`}>{trialStatus(t.status)}</span>}
    </li>)}</ul>
    <p className="nb-small text-muted-foreground mt-5">Data: <a className="nb-link" href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer">ClinicalTrials.gov</a></p>
  </section>;
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  if (!items.length) return null;
  return <section className="nb-detail-section">
    <h2 className="nb-h2 mb-6">Latest from them</h2>
    <ul className="space-y-4">{items.map(n => <li key={n.link}><a className="nb-link nb-h3" href={n.link} target="_blank" rel="noopener noreferrer">{n.title}</a>{n.date && <p className="nb-small text-muted-foreground mt-1">{dateLabel(n.date)}</p>}</li>)}</ul>
  </section>;
}
