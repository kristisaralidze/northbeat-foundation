export type EventRow = { id: string; slug: string; title: string; event_type: string; summary: string | null; starts_at: string | null; ends_at: string | null; apply_deadline_at: string | null; timezone: string | null; city: string | null; venue: string | null; format: string | null; organiser?: { name: string; slug: string } | undefined; termIds?: string[] };
export type OpportunityDeadline = { id: string; slug: string; title: string; deadline_at: string | null };
export type EventsData = { events: EventRow[]; opportunities: OpportunityDeadline[]; now: string; fields?: { id: string; name: string; slug: string }[] };
export type EventFilters = { type: string; city: string; month: string; archive: boolean };
export function dayKey(value: string, timezone = 'Europe/Helsinki'): string {
  const parsed = new Date(value); if (!Number.isFinite(parsed.getTime())) return '';
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed); } catch { return parsed.toISOString().slice(0, 10); }
}
export function isPast(event: EventRow, now: string): boolean {
  if (event.ends_at && Number.isFinite(Date.parse(event.ends_at))) return Date.parse(event.ends_at) < Date.parse(now);
  return Boolean(event.starts_at && dayKey(event.starts_at, event.timezone ?? undefined) < dayKey(now, event.timezone ?? undefined));
}
export function eventDays(event: EventRow) {
  const start = event.starts_at ? dayKey(event.starts_at, event.timezone ?? undefined) : '';
  const end = event.ends_at ? dayKey(event.ends_at, event.timezone ?? undefined) : start;
  return { start, end: end >= start ? end : start };
}
export function inMonth(event: EventRow, month: string) {
  const { start, end } = eventDays(event);
  return Boolean(start && start.slice(0, 7) <= month && end.slice(0, 7) >= month);
}
export function filterEvents(events: EventRow[], filters: EventFilters, now: string) {
  return events.filter((event) => isPast(event, now) === filters.archive && (!filters.type || event.event_type === filters.type) && (!filters.city || event.city === filters.city) && (!filters.month || inMonth(event, filters.month)))
    .sort((a, b) => (Date.parse(a.starts_at ?? '') || Number.MAX_SAFE_INTEGER) - (Date.parse(b.starts_at ?? '') || Number.MAX_SAFE_INTEGER));
}
export function closingSoon(data: EventsData) {
  const now = Date.parse(data.now); const end = now + 14 * 24 * 60 * 60 * 1000;
  return [
    ...data.events.map((event) => ({ id: event.id, slug: event.slug, title: event.title, deadline: event.apply_deadline_at, kind: 'event' as const })),
    ...data.opportunities.map((item) => ({ id: item.id, slug: item.slug, title: item.title, deadline: item.deadline_at, kind: 'opportunity' as const })),
  ].filter((item): item is typeof item & { deadline: string } => Boolean(item.deadline && Date.parse(item.deadline) >= now && Date.parse(item.deadline) <= end)).sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
}
export function validMonth(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : ''; }
export function shiftMonth(month: string, delta: number) {
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta); return date.toISOString().slice(0, 7);
}
export function calendarDays(month: string) {
  const start = new Date(`${month}-01T12:00:00Z`); const offset = (start.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
    const day = new Date(start); day.setUTCDate(i - offset + 1); return day.toISOString().slice(0, 10);
  });
}
export function monthLabel(month: string) { return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`)); }
export function dateLabel(value: string, timezone?: string | null) {
  const key = dayKey(value, timezone ?? undefined);
  return key ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`)) : 'Date to be announced';
}
/** Every YYYY-MM spanned by the given dated events, ascending. */
export function eventMonths(events: EventRow[]) {
  const months = new Set<string>();
  for (const event of events) {
    const { start, end } = eventDays(event);
    if (!start) continue;
    for (let m = start.slice(0, 7); m <= end.slice(0, 7); m = shiftMonth(m, 1)) months.add(m);
  }
  return [...months].sort();
}

/** Same Monday to Sunday week as now, in Helsinki time. */
export function isThisWeek(value: string | null, now: string, timezone = 'Europe/Helsinki') {
  if (!value) return false;
  const day = (v: string) => Date.parse(`${dayKey(v, timezone)}T12:00:00Z`);
  const today = day(now); const weekday = (new Date(today).getUTCDay() + 6) % 7;
  const monday = today - weekday * 86400000; const d = day(value);
  return d >= monday && d < monday + 7 * 86400000;
}
export type ListFilters = { type: string; city: string; online: boolean; field: string };
/** List filters: type, city, online only, field. */
export function matchesListFilters(event: EventRow, f: ListFilters, fields: { id: string; slug: string }[] = []) {
  if (f.type && event.event_type !== f.type) return false;
  if (f.city && event.city !== f.city) return false;
  if (f.online && !(event.format === 'online' || event.format === 'hybrid')) return false;
  if (f.field) { const id = fields.find(x => x.slug === f.field)?.id; if (!id || !(event.termIds ?? []).includes(id)) return false; }
  return true;
}
/** Group dated events by YYYY-MM in order. */
export function groupByMonth(events: EventRow[]) {
  const groups: { month: string; events: EventRow[] }[] = [];
  for (const e of events) { const m = e.starts_at ? dayKey(e.starts_at, e.timezone ?? undefined).slice(0, 7) : ''; const last = groups.at(-1); if (last?.month === m) last.events.push(e); else groups.push({ month: m, events: [e] }); }
  return groups;
}
