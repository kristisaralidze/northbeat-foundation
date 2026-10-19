import { dayKey } from './events';
export function closingDays(deadline: string | null, now: string): number | null {
  if (!deadline || !Number.isFinite(Date.parse(deadline)) || Date.parse(deadline) < Date.parse(now)) return null;
  const days = Math.round((Date.parse(`${dayKey(deadline)}T00:00:00Z`) - Date.parse(`${dayKey(now)}T00:00:00Z`)) / 86400000);
  return days >= 0 && days <= 14 ? days : null;
}
export function timelineRows<T>(items: T[], date: (item: T) => string | null, now: string): ({ kind: 'item'; item: T; date: string | null } | { kind: 'today'; date: string })[] {
  const rows: ({ kind: 'item'; item: T; date: string | null } | { kind: 'today'; date: string })[] = items.map(item => ({ kind: 'item', item, date: date(item) }));
  rows.push({ kind: 'today', date: now });
  return rows.sort((a, b) => (Date.parse(a.date ?? '') || Number.MAX_SAFE_INTEGER) - (Date.parse(b.date ?? '') || Number.MAX_SAFE_INTEGER));
}