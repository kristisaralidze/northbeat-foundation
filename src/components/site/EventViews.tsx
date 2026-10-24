import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { humanize } from '@/lib/admin/entities';
import { calendarDays, dateLabel, eventDays, type EventRow } from '@/lib/events';
import { publicCopy } from '@/lib/profiles';
export function EventList({ events }: { events: EventRow[] }) {
  return <div className="divide-y divide-hairline">{events.map((event) => <article key={event.id} className="grid gap-4 py-7 sm:grid-cols-[12rem_minmax(0,1fr)]">
    <div className="nb-small text-muted-foreground"><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{event.starts_at ? dateLabel(event.starts_at, event.timezone) : 'Date to be announced'}{event.ends_at && eventDays(event).end !== eventDays(event).start && <> to {dateLabel(event.ends_at, event.timezone)}</>}</span></p>{event.city && <p className="mt-2 flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" aria-hidden />{event.city}</p>}</div>
    <div className="min-w-0"><div className="mb-3 flex flex-wrap gap-2"><span className="nb-chip nb-chip-frost">{humanize(event.event_type)}</span>{event.format && <span className="nb-chip">{humanize(event.format)}</span>}</div><h2 className="nb-h3"><Link to="/event/$slug" params={{ slug: event.slug }} className="nb-org-link break-words">{event.title}<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /></Link></h2>{event.summary && <p className="nb-body mt-2 break-words text-muted-foreground">{publicCopy(event.summary)}</p>}</div>
  </article>)}</div>;
}
export function EventCalendar({ events, month, today }: { events: EventRow[]; month: string; today: string }) {
  const days = useMemo(() => calendarDays(month), [month]);
  const byDay = useMemo(() => {
    const ranges = events.map(event => ({ event, ...eventDays(event) }));
    return new Map(days.map(day => [day, ranges.filter(r => r.start && day >= r.start && day <= r.end).map(r => r.event)]));
  }, [events, days]);
  return <div className="overflow-x-auto pb-2"><div className="nb-calendar" aria-label="Event calendar">
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="nb-eyebrow border-b border-hairline p-3 text-center">{day}</div>)}
    {days.map((day) => <div key={day} className={`nb-calendar-day ${day.slice(0, 7) !== month ? 'bg-frost-wash' : 'bg-background'}`}>
      <time dateTime={day} className={`nb-small ${day === today ? 'font-semibold text-primary' : 'text-muted-foreground'}`} aria-label={dateLabel(day)}>{Number(day.slice(-2))}{day === today && <span className="sr-only"> today</span>}</time>
      <div className="mt-2 space-y-2">{(byDay.get(day) ?? []).map((event) => <Link key={event.id} to="/event/$slug" params={{ slug: event.slug }} className="nb-calendar-entry">{event.title}</Link>)}</div>
    </div>)}
  </div></div>;
}
