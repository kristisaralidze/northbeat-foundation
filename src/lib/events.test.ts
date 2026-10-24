import { describe, it, expect } from 'vitest';
import { closingSoon, filterEvents, isPast, calendarDays, inMonth, type EventRow } from './events';
const now = '2026-10-19T08:54:00Z';
const event = (patch: Partial<EventRow> = {}): EventRow => ({ id: 'event', slug: 'event', title: 'Health event', event_type: 'conference', summary: null, starts_at: '2026-10-20T10:00:00Z', ends_at: null, apply_deadline_at: null, timezone: 'Europe/Helsinki', city: 'Helsinki', venue: null, format: 'in_person', ...patch });
describe('events and deadlines', () => {
 it('includes all event applications and opportunities within exactly 14 days', () => {
  const items = closingSoon({ now, events: [event({ apply_deadline_at: now })], opportunities: [{ id: 'opportunity', slug: 'funding', title: 'Funding', deadline_at: '2026-11-02T08:54:00Z' }] });
  expect(items.map((item) => item.kind)).toEqual(['event', 'opportunity']);
 });
 it('excludes deadlines before now and beyond 14 days', () => {
  expect(closingSoon({ now, events: [event({ apply_deadline_at: '2026-10-19T08:53:59Z' })], opportunities: [{ id: 'late', slug: 'late', title: 'Late', deadline_at: '2026-11-02T08:54:01Z' }] })).toEqual([]);
 });
 it('moves ended events to archive and retains ongoing multi-day events', () => {
  expect(isPast(event({ ends_at: '2026-10-19T08:53:59Z' }), now)).toBe(true);
  expect(isPast(event({ starts_at: '2026-10-18T10:00:00Z', ends_at: '2026-10-20T10:00:00Z' }), now)).toBe(false);
 });
 it('keeps an event without an end time until its local day ends', () => {
  expect(isPast(event({ starts_at: '2026-10-18T22:00:00Z' }), now)).toBe(false);
  expect(isPast(event({ starts_at: '2026-10-17T22:00:00Z' }), now)).toBe(true);
 });
 it('filters jointly by type city and month, separate from archive', () => {
  const rows = [event(), event({ id: 'other', event_type: 'meetup' }), event({ id: 'past', starts_at: '2026-09-15T10:00:00Z' })];
  expect(filterEvents(rows, { type: 'conference', city: 'Helsinki', month: '2026-10', archive: false }, now).map((row) => row.id)).toEqual(['event']);
  expect(filterEvents(rows, { type: '', city: '', month: '', archive: true }, now).map((row) => row.id)).toEqual(['past']);
 });
 it('includes multi-day events in every month they span', () => { expect(inMonth(event({ starts_at: '2026-10-31T12:00:00Z', ends_at: '2026-11-02T12:00:00Z' }), '2026-11')).toBe(true); });
 it('builds full Monday-first calendar weeks', () => { const days = calendarDays('2026-10'); expect(days[0]).toBe('2026-09-28'); expect(days.at(-1)).toBe('2026-11-01'); expect(days.length).toBe(35); });
});
import { describe as d3, it as i3, expect as e3 } from 'vitest';
import { isThisWeek, matchesListFilters } from './events';
d3('events list rules', () => {
  i3('this week runs Monday to Sunday', () => {
    // Sat 24 Oct 2026
    e3(isThisWeek('2026-10-25T10:00:00Z', '2026-10-24T08:00:00Z')).toBe(true);
    e3(isThisWeek('2026-10-26T10:00:00Z', '2026-10-24T08:00:00Z')).toBe(false);
    e3(isThisWeek('2026-10-19T10:00:00Z', '2026-10-24T08:00:00Z')).toBe(true);
  });
  i3('online filter keeps online and hybrid events', () => {
    const base = { id: '1', slug: 's', title: 't', event_type: 'meetup', summary: null, starts_at: null, ends_at: null, apply_deadline_at: null, timezone: null, city: 'Oulu', venue: null };
    const f = { type: '', city: '', online: true, field: '' };
    e3(matchesListFilters({ ...base, format: 'hybrid' }, f)).toBe(true);
    e3(matchesListFilters({ ...base, format: 'in_person' }, f)).toBe(false);
  });
});
