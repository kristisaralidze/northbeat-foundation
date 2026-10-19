import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import type { HubItem } from '@/lib/learn';
import { OrganisationLogo } from './OrganisationLogo';

export function LearnError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return <div className="nb-container nb-section"><h1 className="nb-h2">This page didn't load</h1>
    <p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p>
    <button type="button" className="nb-btn nb-btn-primary mt-6" onClick={() => { router.invalidate(); reset(); }}>Try again</button></div>;
}
export function LearnNotFound() {
  return <div className="nb-container nb-section"><h1 className="nb-h2">We couldn't find that page</h1>
    <p className="nb-body mt-4 text-muted-foreground">It may have moved or not be published yet.</p>
    <Link to="/learn" className="nb-btn nb-btn-primary mt-6">Back to Learn</Link></div>;
}

const ROUTE = { organisations: '/org/$slug', opportunities: '/opportunity/$slug', events: '/event/$slug' } as const;
/** A titled list of hub entries; renders nothing when empty. */
export function HubList({ title, kind, items }: { title: string; kind: keyof typeof ROUTE; items: HubItem[] }) {
  if (!items.length) return null;
  return <section>
    <h3 className="nb-eyebrow mb-3">{title}</h3>
    <ul className="divide-y divide-hairline border-y border-hairline">
      {items.map((item) => <li key={item.slug} className={kind === 'organisations' ? 'py-3 flex items-start gap-3' : 'py-3'}>
        {kind === 'organisations' && <OrganisationLogo name={item.title} slug={item.slug} />}
        <div className="min-w-0">
        <Link to={ROUTE[kind]} params={{ slug: item.slug }} className="nb-org-link nb-body font-medium">{item.title}</Link>
        {item.summary && <p className="nb-small mt-1 line-clamp-2 text-muted-foreground">{item.summary}</p>}
        </div>
      </li>)}
    </ul>
  </section>;
}
