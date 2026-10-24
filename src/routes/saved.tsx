import { createFileRoute, Link } from '@tanstack/react-router';
import { EMPTY_SEARCH } from '@/lib/explore';
import { useQuery } from '@tanstack/react-query';
import { searchIndexQuery } from '@/lib/search.query';
import { useSavedItems, type SavedKind } from '@/lib/saved';
import { CardGrid, EntryCard } from '@/components/site/EntryCard';
import { OrganisationLogo } from '@/components/site/OrganisationLogo';
import { humanize } from '@/lib/admin/entities';
import { amountLabel, friendlyDate } from '@/lib/opportunities';
import { countdownLabel, daysUntil } from '@/lib/detail';
import { itemHref, type SearchItem } from '@/lib/search';

export const Route = createFileRoute('/saved')({
  head: () => ({ meta: [
    { title: 'Saved: Northbeat' }, { name: 'description', content: 'Organisations, events and opportunities you saved in this browser.' },
    { property: 'og:title', content: 'Saved: Northbeat' }, { property: 'og:description', content: 'Organisations, events and opportunities you saved in this browser.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: Saved,
});

const SECTIONS: { kind: SavedKind; label: string }[] = [{ kind: 'organisation', label: 'Organisations' }, { kind: 'event', label: 'Events' }, { kind: 'opportunity', label: 'Opportunities' }];

function Saved() {
  const saved = useSavedItems();
  const { data } = useQuery({ ...searchIndexQuery, enabled: saved.length > 0 });
  const now = data?.now ?? new Date().toISOString();
  const live = (kind: SavedKind, slug: string) => data?.items.find(i => i.kind === kind && i.slug === slug);
  return <div className="nb-container nb-section">
    <h1 className="nb-h1">Saved</h1>
    <p className="nb-body mt-4 text-muted-foreground">Saved in this browser only. No account needed.</p>
    {saved.length === 0 && <div className="py-12"><h2 className="nb-h3">Nothing saved yet.</h2><p className="nb-body mt-3 text-muted-foreground">Use the bookmark on any organisation, event or opportunity.</p><Link to="/explore" search={EMPTY_SEARCH} className="nb-link mt-6 inline-block">Explore organisations</Link></div>}
    {SECTIONS.map(section => {
      const items = saved.filter(s => s.kind === section.kind);
      if (!items.length) return null;
      return <section key={section.kind} className="mt-12" aria-labelledby={`saved-${section.kind}`}><h2 id={`saved-${section.kind}`} className="nb-h2 mb-6">{section.label}</h2><CardGrid>{items.map(s => {
        const item = live(s.kind, s.slug);
        return <SavedCard key={s.slug} kind={s.kind} slug={s.slug} title={item?.title ?? s.title} item={item} now={now} pending={!data} />;
      })}</CardGrid></section>;
    })}
  </div>;
}

function SavedCard({ kind, slug, title, item, now, pending }: { kind: SavedKind; slug: string; title: string; item: SearchItem | undefined; now: string; pending: boolean }) {
  const href = itemHref({ kind, slug });
  const link = <a href={href} className="nb-org-link">{title}</a>;
  if (!item) return <EntryCard id={slug} kind={kind} slug={slug} title={title} link={link} line={pending ? null : 'No longer listed on Northbeat.'} facts={[]} />;
  const days = item.date ? daysUntil(item.date, now) : null;
  const when = kind === 'event' ? (item.date ? (days !== null && days < 0 ? `Was ${friendlyDate(item.date, now)}` : countdownLabel(item.date, now) ?? friendlyDate(item.date, now)) : 'Date to be announced')
    : kind === 'opportunity' ? (item.date ? (days !== null && days < 0 ? `Closed ${friendlyDate(item.date, now)}` : `Closes ${friendlyDate(item.date, now)}`) : 'No fixed deadline') : null;
  const soon = days !== null && days >= 0 && days < 14;
  return <EntryCard id={slug} kind={kind} slug={slug} title={item.title} link={kind === 'organisation' ? <Link to="/org/$slug" params={{ slug }} className="nb-org-link">{item.title}</Link> : kind === 'event' ? <Link to="/event/$slug" params={{ slug }} className="nb-org-link">{item.title}</Link> : <Link to="/opportunity/$slug" params={{ slug }} className="nb-org-link">{item.title}</Link>}
    media={kind === 'organisation' ? <OrganisationLogo name={item.title} uploaded={item.logo} website={item.website} choice={item.logoChoice ?? 'icon'} /> : undefined}
    line={item.line}
    facts={[item.type ? humanize(item.type) : null, kind === 'opportunity' ? amountLabel({ amount_min_eur: item.amountMin, amount_max_eur: item.amountMax }) : item.online ? 'Online' : item.city, kind === 'organisation' ? null : item.date && kind === 'event' ? friendlyDate(item.date, now) : null]}
    footer={when && <span className={`nb-countdown${soon ? ' nb-countdown-signal' : ''}`}>{when}</span>} />;
}
