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
export type CalendarEvent = { id: string; title: string; start: string; end: string | null; location: string; description: string; url: string };
const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function eventCalendar(event: CalendarEvent) {
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Northbeat//Events//EN', 'BEGIN:VEVENT', `UID:${event.id}@northbeat`, `DTSTAMP:${stamp(event.start)}`, `DTSTART:${stamp(event.start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escape(event.title)}`, `LOCATION:${escape(event.location)}`, `DESCRIPTION:${escape(event.description)}`, `URL:${event.url}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
export function googleCalendar(event: CalendarEvent) {
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${stamp(event.start)}/${stamp(end)}`, details: `${event.description}\n${event.url}`, location: event.location });
  return `https://calendar.google.com/calendar/render?${params}`;
}