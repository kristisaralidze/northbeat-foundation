import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { CalendarDays, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventCalendar } from '@/components/site/EventViews';
import { EventRowItem } from '@/components/site/ListItems';
import { CalendarMenu } from '@/components/site/CalendarMenu';
import { SaveButton } from '@/components/site/SaveButton';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { countdownLabel, countdownClass, daysUntil, type CalendarEvent } from '@/lib/detail';
import { friendlyDate } from '@/lib/opportunities';
import { EVENT_TYPES, humanize } from '@/lib/admin/entities';
import { eventsQuery } from '@/lib/events.query';
import { compactSearch } from '@/lib/search-params';
import { closingSoon, dayKey, filterEvents, monthLabel, shiftMonth, validMonth, dateLabel, groupByMonth, isThisWeek, matchesListFilters, type EventRow } from '@/lib/events';
import { memo, useMemo, useState } from 'react';
import { ListFilterSelect } from '@/components/site/ListFilterSelect';
import { SlidersHorizontal } from 'lucide-react';
import { FilterSheet } from '@/components/site/FilterSheet';
const searchSchema = z.object({ type: fallback(z.string(), '').default(''), city: fallback(z.string(), '').default(''), field: fallback(z.string(), '').default(''), online: fallback(z.boolean(), false).default(false), month: fallback(z.string(), '').default(''), view: fallback(z.string(), 'list').default('list'), archive: fallback(z.boolean(), false).default(false) });
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
const MonthList = memo(function MonthList({ events, now, label }: { events: EventRow[]; now: string; label?: string }) {
  const groups = useMemo(() => groupByMonth(events), [events]);
  return <div>{label && <h2 className="nb-h2 mt-12">{label}</h2>}{groups.map(g => <section key={g.month || 'tba'} aria-label={g.month ? monthLabel(g.month) : 'Dates to be announced'}><h2 className="nb-month-heading">{g.month ? monthLabel(g.month) : 'Dates to be announced'}</h2><ul>{g.events.map(e => <EventRowItem key={e.id} event={e} now={now} />)}</ul></section>)}</div>;
});
function Events() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data } = useSuspenseQuery(eventsQuery); const search = Route.useSearch(); const navigate = useNavigate({ from: '/events' });
  const calendar = search.view === 'calendar'; const currentMonth = dayKey(data.now).slice(0, 7); const month = validMonth(search.month) || currentMonth;
  const { upcoming, past, inCalendar, types, cities, fieldOptions, deadlines } = useMemo(() => {
    const fields = data.fields ?? [];
    const list = { type: search.type, city: search.city, online: search.online, field: search.field };
    const future = filterEvents(data.events, { type: '', city: '', month: '', archive: false }, data.now);
    const history = filterEvents(data.events, { type: '', city: '', month: '', archive: true }, data.now);
    const pick = (patch: Partial<typeof list> = {}) => future.filter(e => matchesListFilters(e, { ...list, ...patch }, fields));
    return {
      upcoming: pick(), past: history.filter(e => matchesListFilters(e, list, fields)).reverse(),
      inCalendar: filterEvents(future, { type: '', city: '', month, archive: false }, data.now).filter(e => matchesListFilters(e, list, fields)),
      types: EVENT_TYPES.filter(type => pick({ type }).length > 0 || type === search.type),
      cities: [...new Set(pick({ city: '' }).map(e => e.city).filter((city): city is string => Boolean(city)))].sort(),
      fieldOptions: fields.filter(f => pick({ field: f.slug }).length > 0 || f.slug === search.field),
      deadlines: closingSoon(data),
    };
  }, [data, search.type, search.city, search.online, search.field, month]);
  const update = (patch: Partial<typeof search>) => navigate({ search: (prev) => ({ ...prev, ...patch }), resetScroll: false });
  const filtered = Boolean(search.type || search.city || search.field || search.online);
  const controls = <div className="flex flex-wrap items-end gap-4 pb-6">
    <ListFilterSelect label="Type" ariaLabel="Event type" allLabel="All types" value={search.type} options={types.map(type => ({ value: type, label: humanize(type) }))} onValueChange={type => { void update({ type }); }} />
    <ListFilterSelect label="City" allLabel="All cities" value={search.city} options={cities.map(city => ({ value: city, label: city }))} onValueChange={city => { void update({ city }); }} />
    {(fieldOptions.length > 0 || search.field) && <ListFilterSelect label="Field" allLabel="All fields" value={search.field} options={fieldOptions.map(f => ({ value: f.slug, label: f.name }))} onValueChange={field => { void update({ field }); }} />}
    <label className="flex min-h-11 items-center gap-3 nb-small"><Checkbox checked={search.online} onCheckedChange={v => update({ online: v === true })} />Online only</label>
    {filtered && <Button variant="ghost" className="nb-btn nb-btn-quiet" onClick={() => update({ type: '', city: '', field: '', online: false })}>Clear filters</Button>}
  </div>;
  return <>
    {deadlines.length > 0 && <section className="hidden md:block bg-frost-wash" aria-label="Closing soon"><div className="nb-container py-7"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-2"><h2 className="nb-h3">Closing soon</h2><span className="nb-small text-muted-foreground">Next 14 days, {deadlines.length} {deadlines.length === 1 ? 'deadline' : 'deadlines'}</span></div>
      <ul className="nb-deadline-strip">{deadlines.map((item) => <li key={`${item.kind}-${item.id}`} className="nb-card"><p className="nb-small text-muted-foreground mb-2">{item.kind === 'event' ? 'Event applications' : 'Opportunity'}, {friendlyDate(item.deadline, data.now)}</p><span className={countdownClass(daysUntil(item.deadline,data.now))}>{countdownLabel(item.deadline,data.now)}</span><h3 className="nb-h3">{item.kind === 'event' ? <Link to="/event/$slug" params={{ slug: item.slug }} className="nb-org-link break-words">{item.title}</Link> : <Link to="/opportunity/$slug" params={{ slug: item.slug }} className="nb-org-link break-words">{item.title}</Link>}</h3></li>)}</ul>
    </div></section>}
    <div className="nb-container nb-section nb-events-page"><header className="mb-6 flex flex-wrap items-end justify-between gap-4"><h1 className="nb-h1">Events</h1>
      <div className="flex gap-1" aria-label="Event view"><Button variant="ghost" className={`nb-btn ${!calendar ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={!calendar} onClick={() => update({ view: 'list' })}><List className="h-4 w-4" />List</Button><Button variant="ghost" className={`nb-btn ${calendar ? 'nb-btn-primary' : 'nb-btn-quiet'}`} aria-pressed={calendar} onClick={() => update({ view: 'calendar' })}><CalendarDays className="h-4 w-4" />Calendar</Button></div></header>
      <div className="md:hidden"><Button variant="ghost" className="nb-filter-chip" onClick={() => setFiltersOpen(true)}><SlidersHorizontal className="h-4 w-4" />Filters</Button></div>
      <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen}>{controls}</FilterSheet>
      <div className="hidden md:block">{controls}</div>
      <div className="my-6 flex flex-wrap items-center justify-between gap-4"><p className="nb-small" role="status"><strong className="font-medium">{upcoming.length}</strong> upcoming {upcoming.length === 1 ? 'event' : 'events'}</p>
        {calendar ? <div className="flex items-center gap-3"><Button variant="ghost" className="nb-btn nb-btn-quiet" aria-label="Previous month" title="Previous month" onClick={() => update({ month: shiftMonth(month, -1) })}><ChevronLeft className="h-4 w-4" /></Button><span className="nb-small font-medium">{monthLabel(month)}</span><Button variant="ghost" className="nb-btn nb-btn-quiet" aria-label="Next month" title="Next month" onClick={() => update({ month: shiftMonth(month, 1) })}><ChevronRight className="h-4 w-4" /></Button></div>
          : past.length > 0 && <label className="flex min-h-11 items-center gap-3 nb-small"><Switch checked={search.archive} onCheckedChange={v => update({ archive: v })} />Show past events</label>}</div>
      {calendar && <EventCalendar events={inCalendar} month={month} today={dayKey(data.now)} />}
      {!calendar && upcoming.length > 0 && <MonthList events={upcoming} now={data.now} />}
      {!calendar && upcoming.length === 0 && <div className="py-12"><h2 className="nb-h3">{filtered ? 'No upcoming events match these filters.' : 'No upcoming events right now.'}</h2>{filtered && <Button variant="ghost" className="nb-btn nb-btn-secondary mt-6" onClick={() => update({ type: '', city: '', field: '', online: false })}>Clear filters</Button>}</div>}
      {!calendar && search.archive && past.length > 0 && <MonthList events={past} now={data.now} label="Past events" />}
    </div>
  </>;
}
