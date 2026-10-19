import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventList, EventCalendar } from '@/components/site/EventViews';
import { EVENT_TYPES, humanize } from '@/lib/admin/entities';
import { eventsQuery } from '@/lib/events.query';
import { compactSearch } from '@/lib/search-params';
import { closingSoon, eventMonths, dayKey, filterEvents, monthLabel, shiftMonth, validMonth, dateLabel } from '@/lib/events';
const searchSchema = z.object({ type: fallback(z.string(), '').default(''), city: fallback(z.string(), '').default(''), month: fallback(z.string(), '').default(''), view: fallback(z.string(), 'list').default('list'), archive: fallback(z.boolean(), false).default(false) });
export const Route = createFileRoute('/events')({
  validateSearch: zodValidator(searchSchema),
  search: { middlewares: [({ search, next }) => compactSearch(next(search), { view: 'list' })] },
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  head: () => ({ meta: [
    { title: 'Health innovation events & deadlines: Northbeat' }, { name: 'description', content: 'Upcoming Nordic health innovation conferences, pitch competitions, hackathons, demo days and meetups. Browse the calendar and deadlines closing soon.' },
    { property: 'og:title', content: 'Health innovation events & deadlines: Northbeat' }, { property: 'og:description', content: 'Nordic health innovation events, application deadlines and past events.' }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: '/events' }, { name: 'twitter:card', content: 'summary' },
  ], links: [{ rel: 'canonical', href: '/events' }] }),
  component: Events,
  errorComponent: ({ reset }) => { const client = useQueryClient(); return <div className="nb-container nb-section"><h1 className="nb-h2">Events couldn’t be loaded</h1><p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await client.resetQueries({ queryKey: ['public-events'] }); reset(); }}>Try again</Button></div>; },
  notFoundComponent: () => <div className="nb-container nb-section"><h1 className="nb-h2">Events not found</h1></div>,
});
function Events() {
  const { data } = useSuspenseQuery(eventsQuery); const search = Route.useSearch(); const navigate = useNavigate({ from: '/events' });
  const calendar = search.view === 'calendar'; const currentMonth = dayKey(data.now).slice(0, 7); const chosenMonth = validMonth(search.month); const month = chosenMonth || currentMonth;
  const filters = { type: search.type, city: search.city, month: calendar ? month : chosenMonth, archive: search.archive };
  const events = filterEvents(data.events, filters, data.now); const deadlines = closingSoon(data);
  const pool = (patch: Partial<typeof filters>) => filterEvents(data.events, { ...filters, ...patch }, data.now);
  const types = EVENT_TYPES.filter((type) => pool({ type }).length > 0);
  const months = eventMonths(pool({ month: '' })); const monthValue = calendar ? month : chosenMonth;
  const monthOptions = monthValue && !months.includes(monthValue) ? [...months, monthValue].sort() : months;
  const cities = [...new Set(pool({ city: '' }).map((event) => event.city).filter((city): city is string => Boolean(city)))].sort();
  const update = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const undated = filterEvents(data.events, { ...filters, month: '' }, data.now).filter((event) => !event.starts_at);
  return <>
    {deadlines.length > 0 && <section className="border-b border-hairline bg-frost-wash" aria-label="Closing soon"><div className="nb-container py-7"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="nb-h3">Closing soon</h2><span className="nb-small text-muted-foreground">Next 14 days · {deadlines.length} {deadlines.length === 1 ? 'deadline' : 'deadlines'}</span></div>
      {<ul className="nb-deadline-strip">{deadlines.map((item) => <li key={`${item.kind}-${item.id}`} className="nb-card"><p className="nb-eyebrow mb-2">{item.kind === 'event' ? 'Event applications' : 'Opportunity'} · {dateLabel(item.deadline)}</p><h3 className="nb-h3">{item.kind === 'event' ? <Link to="/event/$slug" params={{ slug: item.slug }} className="nb-org-link break-words">{item.title}</Link> : <Link to="/opportunity/$slug" params={{ slug: item.slug }} className="nb-org-link break-words">{item.title}</Link>}</h3></li>)}</ul>}
    </div></section>}
    <div className="nb-container nb-section"><header className="mb-8 flex flex-wrap items-end justify-between gap-6"><div><p className="nb-eyebrow mb-3">Nordic health innovation</p><h1 className="nb-h1">Events</h1></div><div className="flex gap-2" aria-label="Event period"><Button variant="ghost" className={`nb-btn ${!search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={!search.archive} onClick={() => update({ archive: false, month: '' })}>Upcoming</Button><Button variant="ghost" className={`nb-btn ${search.archive ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={search.archive} onClick={() => update({ archive: true, month: calendar ? shiftMonth(currentMonth, -1) : '' })}>Archive</Button></div></header>
      <div className="flex flex-wrap items-end gap-4 border-b border-hairline pb-6">
        <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">Type</span><select aria-label="Event type" className="nb-input" value={search.type} onChange={(e) => update({ type: e.target.value })}><option value="">All types</option>{types.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}{search.type && !EVENT_TYPES.some((type) => type === search.type) && <option value={search.type}>{humanize(search.type)}</option>}</select></label>
        <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">City</span><select aria-label="City" className="nb-input" value={search.city} onChange={(e) => update({ city: e.target.value })}><option value="">All cities</option>{cities.map((city) => <option key={city}>{city}</option>)}{search.city && !cities.includes(search.city) && <option>{search.city}</option>}</select></label>
        <label className="min-w-0 flex-1 basis-40"><span className="nb-eyebrow mb-2 block">Month</span><select aria-label="Month" className="nb-input" value={monthValue} onChange={(e) => update({ month: e.target.value })}>{!calendar && <option value="">All months</option>}{monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
        {(search.type || search.city || search.month) && <Button variant="ghost" className="nb-btn nb-btn-quiet" onClick={() => update({ type: '', city: '', month: '' })}>Clear filters</Button>}
        <div className="flex gap-1" aria-label="Event view"><Button variant="ghost" className={`nb-btn ${!calendar ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={!calendar} title="List view" onClick={() => update({ view: 'list' })}><List className="h-4 w-4" aria-hidden /><span>List</span></Button><Button variant="ghost" className={`nb-btn ${calendar ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={calendar} title="Calendar view" onClick={() => update({ view: 'calendar' })}><CalendarDays className="h-4 w-4" aria-hidden /><span>Calendar</span></Button></div>
      </div>
      <div className="my-6 flex flex-wrap items-center justify-between gap-4"><p className="nb-small text-muted-foreground" role="status">{events.length} {search.archive ? 'past' : 'upcoming'} {events.length === 1 ? 'event' : 'events'}{(calendar || chosenMonth) && ` · ${monthLabel(month)}`}</p>{calendar && <div className="flex items-center gap-3"><Button variant="ghost" className="nb-btn nb-btn-quiet" aria-label="Previous month" title="Previous month" onClick={() => update({ month: shiftMonth(month, -1) })}><ChevronLeft className="h-4 w-4" /></Button><span className="nb-small font-medium">{monthLabel(month)}</span><Button variant="ghost" className="nb-btn nb-btn-quiet" aria-label="Next month" title="Next month" onClick={() => update({ month: shiftMonth(month, 1) })}><ChevronRight className="h-4 w-4" /></Button></div>}</div>
      {calendar && <EventCalendar events={events} month={month} today={dayKey(data.now)} />}
      {!calendar && events.length > 0 && <EventList events={events} />}
      {events.length === 0 && <div className="py-12"><h2 className="nb-h3">{search.archive ? 'No past events found' : 'No upcoming events found'}</h2><p className="nb-body mt-3 text-muted-foreground">{search.type || search.city || chosenMonth ? 'No events match these filters.' : 'We’re adding events. Check back soon.'}</p></div>}
      {calendar && !chosenMonth && undated.length > 0 && <section className="mt-8 border-t border-hairline pt-6"><h2 className="nb-h3">Dates to be announced</h2><EventList events={undated} /></section>}
    </div>
  </>;
}
