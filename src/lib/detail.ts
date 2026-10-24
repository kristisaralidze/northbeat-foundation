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
  const start = weekday(value ?? now); const today = weekday(now);
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
export type CloseCandidate = { id: string; slug?: string | undefined; title: string; city: string | null; type?: string | null; prominence?: number | null | undefined; fieldIds: string[]; countryIds?: string[] };
const typeLabel = (type: string) => { const word = type.replace(/_/g, ' '); return `Also ${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`; };
const RESEARCH_TYPES = new Set(['university', 'research_group']);
const VENTURE_TYPES = new Set(['startup', 'community']);
/** Stable tie-break hash of both slugs, never alphabetical. */
export function slugPairHash(a: string, b: string) {
  const key = [a, b].sort().join('~'); let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}
/**
 * "Close to them": only organisations sharing at least two of same type, same city, a shared field
 * or a direct relation. Ranked by direct relation, then same type and same city, then prominence;
 * ties break on a stable hash of both slugs. Universities and research groups never sit next to
 * startups or communities unless directly related. At most four; hidden when fewer than two qualify.
 */
export function closeToThem<T extends CloseCandidate>(rows: T[], self: { id: string; slug?: string | undefined; city: string | null; type?: string | null; fieldNames: Record<string, string>; countryNames?: Record<string, string>; relations: Record<string, string> }, limit = 4) {
  const selfSlug = self.slug ?? self.id;
  const candidates = rows.filter(row => row.id !== self.id).map(row => {
    const relation = self.relations[row.id] ?? null;
    const sameType = Boolean(self.type && row.type === self.type);
    const sameCity = Boolean(self.city && row.city?.toLowerCase() === self.city.toLowerCase());
    const sharedField = row.fieldIds.find(id => self.fieldNames[id]) ?? null;
    const signals = Number(Boolean(relation)) + Number(sameType) + Number(sameCity) + Number(Boolean(sharedField));
    return { row, relation, sameType, sameCity, sharedField, signals };
  }).filter(c => {
    if (c.signals < 2) return false;
    const cross = (RESEARCH_TYPES.has(self.type ?? '') && VENTURE_TYPES.has(c.row.type ?? '')) || (VENTURE_TYPES.has(self.type ?? '') && RESEARCH_TYPES.has(c.row.type ?? ''));
    return cross ? Boolean(c.relation) : true;
  });
  const rank = (c: (typeof candidates)[number]) => (c.relation ? 0 : c.sameType && c.sameCity ? 1 : 2);
  candidates.sort((a, b) => rank(a) - rank(b)
    || (a.row.prominence || 99) - (b.row.prominence || 99)
    || slugPairHash(selfSlug, a.row.slug ?? a.row.id) - slugPairHash(selfSlug, b.row.slug ?? b.row.id));
  const picked: (T & { reason: string; score: number })[] = []; let cityUsed = false;
  for (const c of candidates.slice(0, Math.min(limit, 4))) {
    const cityReason = c.sameCity ? `Also in ${c.row.city}` : null;
    const reason = c.relation ?? (c.sharedField ? `Same field: ${self.fieldNames[c.sharedField]}` : null) ?? (c.sameType && c.row.type ? typeLabel(c.row.type) : null) ?? (cityReason && !cityUsed ? cityReason : null) ?? (c.sameType && c.row.type ? typeLabel(c.row.type) : cityReason);
    if (!reason) continue;
    if (reason === cityReason) cityUsed = true;
    picked.push({ ...c.row, reason, score: c.signals });
  }
  return picked.length < 2 ? [] : picked;
}
export function urgencyLevel(days: number | null): 'filled' | 'outline' | 'plain' {
  if (days === null || days < 0 || days > 14) return 'plain';
  return days <= 7 ? 'filled' : 'outline';
}
export const countdownClass = (days: number | null) => `nb-countdown nb-countdown-${urgencyLevel(days)}`;
export const offerChips = (type: string, custom: unknown): string[] => {
  const values = Array.isArray(custom) ? custom.filter((v): v is string => typeof v === 'string' && Boolean(v.trim())) : [];
  const defaults: Record<string,string[]> = { incubator:['Workspace','Coaching','Investor intros'], accelerator:['Coaching','Growth support','Investor intros'], investor:['Investment','Investor network'], funder:['Funding','Application support'], university:['Research expertise','Research collaboration'], research_group:['Research expertise','Research collaboration'], lab:['Testing','Research expertise'], hospital_innovation_unit:['Clinical insight','Validation support'], service_provider:['Specialist support','Expert advice'], public_agency:['Public guidance','Funding information'], patient_organisation:['Patient perspectives','Community connections'], community:['Peer connections','Events'], care_provider:['Clinical insight','Care expertise'] };
  return (values.length ? values : defaults[type] ?? []).slice(0,4);
};
/** Short reason chip for a relationship group label. */
export const RELATION_REASON: Record<string, string> = { 'Invested in': 'Invested in', 'Backed by': 'Backer', 'Spun out of': 'Parent', Spinouts: 'Spinout', 'Acquired by': 'Acquirer', Acquired: 'Acquired', Partners: 'Partner' };
export function outlookCalendar(event: CalendarEvent) {
  if (event.allDay) return `https://outlook.live.com/calendar/0/action/compose?${new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: event.title, startdt: dayKey(event.start), enddt: `${nextYmd(event.start).slice(0, 4)}-${nextYmd(event.start).slice(4, 6)}-${nextYmd(event.start).slice(6)}`, allday: 'true', body: `${event.description}\n${event.url}` })}`;
  const end = event.end && Date.parse(event.end) > Date.parse(event.start) ? event.end : new Date(Date.parse(event.start) + 3600000).toISOString();
  const params = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: event.title, startdt: new Date(event.start).toISOString(), enddt: new Date(end).toISOString(), body: `${event.description}\n${event.url}`, location: event.location });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}
export const googleMapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
