import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { eventsQuery } from '@/lib/events.query';
import { opportunitiesQuery } from '@/lib/opportunities.query';
import { happeningItems } from '@/lib/home-story';
import { dateLabel } from '@/lib/events';
import { publicTitle } from '@/lib/profiles';
export function HomeHappening() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: opportunities } = useSuspenseQuery(opportunitiesQuery);
  const items = happeningItems(events, opportunities);
  if (!items.length) return null;
  return <section className="nb-home-happening" aria-labelledby="happening-heading">
    <div className="nb-container"><h2 id="happening-heading" className="nb-network-heading">Happening now</h2></div>
    <div className="nb-home-happening-window"><div className="nb-home-happening-track">
      {items.map(item => <article key={item.id} className="nb-home-happening-item">
        <time dateTime={item.date}>{dateLabel(item.date)}</time>
        <h3><Link className="nb-link" to={item.kind === 'event' ? '/event/$slug' : '/opportunity/$slug'} params={{ slug: item.slug }}>{publicTitle(item.title)}</Link></h3>
        <p>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
      </article>)}
    </div></div>
  </section>;
}