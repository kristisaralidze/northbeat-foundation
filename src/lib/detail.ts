import { dayKey } from './events';
const DAY = 86400000;
export function daysUntil(value: string | null, now: string, timezone = 'Europe/Helsinki'): number | null {
  if (!value || !dayKey(value, timezone) || !dayKey(now, timezone)) return null;
  return Math.round((Date.parse(dayKey(value, timezone)) - Date.parse(dayKey(now, timezone))) / DAY);
}
export function withinSevenDays(value: string | null, anchor: string | null) {
  return Boolean(value && anchor && Number.isFinite(Date.parse(value)) && Math.abs(Date.parse(value) - Date.parse(anchor)) <= 7 * DAY);
}
export function nearbyFirst<T extends { id: string; city: string | null; countryIds: string[]; title: string }>(rows: T[], city: string | null, countryIds: string[]) {
  const rank = (row: T) => city && row.city === city ? 0 : row.countryIds.some(id => countryIds.includes(id)) ? 1 : 2;
  return [...rows].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title)).slice(0, 4);
}
export type CalendarEvent = { id: string; title: string; start: string; end: string | null; location: string; description: string; url: string; allDay?: boolean };
const ymd = (iso: string) => dayKey(iso).replace(/-/g, '');
const nextYmd = (iso: string) => { const d = new Date(`${dayKey(iso)}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function eventCalendar(event: CalendarEvent) {
  if (event.allDay) return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northbeat//Events//EN', 'BEGIN:VEVENT', `UID:${event.id}@northbeat`, `DTSTAMP:${stamp(event.start)}`, `DTSTART;VALUE=DATE:${ymd(event.start)}`, `DTEND;VALUE=DATE:${nextYmd(event.start)}`, `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(event.description)}`, `URL:${event.url}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northbeat//Events//EN', 'BEGIN:VEVENT', `UID:${event.id}@northbeat`, `DTSTAMP:${stamp(event.start)}`, `DTSTART:${stamp(event.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escape(event.title)}`, `LOCATION:${escape(event.location)}`, `DESCRIPTION:${escape(event.description)}`, `URL:${event.url}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
export function googleCalendar(event: CalendarEvent) {
  if (event.allDay) return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${ymd(event.start)}/${nextYmd(event.start)}`, details: `${event.description}\n${event.url}` })}`;
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${stamp(event.start)}/${stamp(end)}`, details: `${event.description}\n${event.url}`, location: event.location });
  return `https://calendar.google.com/calendar/render?${params}`;
}
/** Countdown chip text: "Today", "Tomorrow", "This weekend" (upcoming Sat/Sun in the current week) or "In n days". */
export function countdownLabel(value: string | null, now: string, timezone = 'Europe/Helsinki'): string | null {
  const days = daysUntil(value, now, timezone);
  if (days === null || days < 0) return null;
  if (days === 0) return 'Today';
  const weekday = (iso: string) => (new Date(`${dayKey(iso, timezone)}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon=0
  const start = weekday(value!); const today = weekday(now);
  if (days <= 6 && start >= 5 && today < 5 && today + days <= 6) return 'This weekend';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}
/** Within n calendar days before or after the anchor. */
export function withinDays(value: string | null, anchor: string | null, range = 3, timezone = 'Europe/Helsinki') {
  if (!value || !anchor) return false;
  const diff = daysUntil(value, anchor, timezone);
  return diff !== null && Math.abs(diff) <= range;
}
/** Closed once the apply deadline passes; without one, once the event has started. */
export function registrationClosed(applyBy: string | null, start: string | null, now: string) {
  const limit = applyBy ?? start;
  return Boolean(limit && Number.isFinite(Date.parse(limit)) && Date.parse(now) > Date.parse(limit));
}
export type CloseCandidate = { id: string; title: string; city: string | null; type?: string | null; fieldIds: string[]; countryIds?: string[] };
const typeLabel = (type: string) => { const word = type.replace(/_/g, ' '); return `Also ${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`; };
/** Top 6 by score: direct relation +100, same city +30, same type +20, each shared field +10, same country +5. The chip names the strongest match. */
export function closeToThem<T extends CloseCandidate>(rows: T[], self: { id: string; city: string | null; type?: string | null; fieldNames: Record<string, string>; countryNames?: Record<string, string>; relations: Record<string, string> }, limit = 6) {
  const picked: (T & { reason: string; score: number })[] = [];
  for (const row of rows) {
    if (row.id === self.id) continue;
    const fields = row.fieldIds.filter(id => self.fieldNames[id]);
    const country = (row.countryIds ?? []).find(id => self.countryNames?.[id]);
    const parts: [number, string][] = [];
    if (self.relations[row.id]) parts.push([100, self.relations[row.id]!]);
    if (self.city && row.city && row.city.toLowerCase() === self.city.toLowerCase()) parts.push([30, `Also in ${row.city}`]);
    if (self.type && row.type === self.type) parts.push([20, typeLabel(row.type)]);
    if (fields.length) parts.push([10 * fields.length, `Same field: ${self.fieldNames[fields[0]!]}`]);
    if (country) parts.push([5, `Also in ${self.countryNames![country]}`]);
    if (!parts.length) continue;
    const score = parts.reduce((sum, [n]) => sum + n, 0);
    const strongest = [...parts].sort((x, y) => y[0] - x[0])[0]!;
    picked.push({ ...row, reason: strongest[1], score });
  }
  return picked.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
/** Short reason chip for a relationship group label. */
export const RELATION_REASON: Record<string, string> = { 'Invested in': 'Invested in', 'Backed by': 'Backer', 'Spun out of': 'Parent', Spinouts: 'Spinout', 'Acquired by': 'Acquirer', Acquired: 'Acquired', Partners: 'Partner' };
export function outlookCalendar(event: CalendarEvent) {
  if (event.allDay) return `https://outlook.live.com/calendar/0/action/compose?${new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: event.title, startdt: dayKey(event.start), enddt: `${nextYmd(event.start).slice(0, 4)}-${nextYmd(event.start).slice(4, 6)}-${nextYmd(event.start).slice(6)}`, allday: 'true', body: `${event.description}\n${event.url}` })}`;
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  const params = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: event.title, startdt: new Date(event.start).toISOString(), enddt: new Date(end).toISOString(), body: `${event.description}\n${event.url}`, location: event.location });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}
export const googleMapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
