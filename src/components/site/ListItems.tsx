import { Link } from '@tanstack/react-router';
import { EntryCard } from './EntryCard';
import { CalendarMenu } from './CalendarMenu';
import { SaveButton } from './SaveButton';
import { humanize } from '@/lib/admin/entities';
import { amountLabel, friendlyDate, isRolling, type OpportunityRow } from '@/lib/opportunities';
import { publicTitle, publicCopy, safeWebUrl } from '@/lib/profiles';
import { countdownLabel, daysUntil, type CalendarEvent } from '@/lib/detail';
import { dateLabel, isThisWeek, type EventRow } from '@/lib/events';

/** Shared list items: used by Opportunities, Events and the Start pages. */
export function OpportunityCard({ opportunity: o, now }: { opportunity: OpportunityRow; now: string }) {
  const amount = amountLabel(o); const days = o.deadline_at ? daysUntil(o.deadline_at, now) : null;
  const apply = safeWebUrl(o.apply_url ?? null) ?? `https://nordic-heartbeat.lovable.app/opportunity/${encodeURIComponent(o.slug)}`;
  const cal: CalendarEvent | null = o.deadline_at && days !== null && days >= 0 ? { id: o.id, title: `Deadline: ${publicTitle(o.title)}`, start: o.deadline_at, end: null, allDay: true, location: '', description: `Apply: ${apply}`, url: apply } : null;
  const when = o.deadline_at ? (days !== null && days < 0 ? `Closed ${friendlyDate(o.deadline_at, now)}` : `Closes ${friendlyDate(o.deadline_at, now)}`) : isRolling(o) ? 'Open all year' : 'Next call to be announced';
  return <EntryCard id={o.id} kind="opportunity" slug={o.slug} title={publicTitle(o.title)}
    link={<Link to="/opportunity/$slug" params={{ slug: o.slug }} className="nb-org-link">{publicTitle(o.title)}</Link>}
    line={o.summary ? publicCopy(o.summary) : null}
    facts={[humanize(o.type), amount || (o.type === 'job' ? o.location : null), when]}
    footer={(cal || (days !== null && days >= 0)) && <>{days !== null && days >= 0 && <span className={`nb-countdown${days < 14 ? ' nb-countdown-signal' : ''}`}>{days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : `In ${days} days`}</span>}{cal && <CalendarMenu event={cal} slug={o.slug} label="Add deadline to calendar" compact />}</>} />;
}

export function EventRowItem({ event, now }: { event: EventRow; now: string }) {
  const tz = event.timezone ?? 'Europe/Helsinki';
  const part = (o: Intl.DateTimeFormatOptions) => event.starts_at ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...o }).format(new Date(event.starts_at)) : '';
  const online = event.format === 'online';
  const cal: CalendarEvent | null = event.starts_at ? { id: event.id, title: event.title, start: event.starts_at, end: event.ends_at, location: online ? 'Online' : [event.venue, event.city].filter(Boolean).join(', '), description: event.summary ?? '', url: `https://nordic-heartbeat.lovable.app/event/${encodeURIComponent(event.slug)}` } : null;
  const countdown = countdownLabel(event.starts_at, now, tz); const days = daysUntil(event.starts_at, now, tz);
  return <li className="nb-event-row" data-this-week={isThisWeek(event.starts_at, now, tz)}>
    <div className="nb-event-date" aria-hidden>{event.starts_at ? <><strong>{part({ day: 'numeric' })}</strong><span>{part({ month: 'short' })}, {part({ weekday: 'short' })}</span></> : <span>Date to be announced</span>}</div>
    <div className="min-w-0"><h3 className="nb-h3 break-words"><Link to="/event/$slug" params={{ slug: event.slug }} className="nb-org-link">{event.title}</Link></h3>
      <p className="nb-event-meta">{event.starts_at ? dateLabel(event.starts_at, event.timezone) : ''}{event.starts_at ? ', ' : ''}{humanize(event.event_type)}, {online ? 'Online' : event.city ?? 'Venue to be announced'}</p></div>
    <div className="nb-event-actions">{countdown && <span className={`nb-countdown${days !== null && days < 14 ? ' nb-countdown-signal' : ''}`}>{countdown}</span>}{cal && Date.parse(event.ends_at ?? event.starts_at ?? '') >= Date.parse(now) && <CalendarMenu event={cal} slug={event.slug} compact />}<SaveButton kind="event" slug={event.slug} title={event.title} /></div>
  </li>;
}
