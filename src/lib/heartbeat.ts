export type HeartbeatOrg = { name: string; website: string | null; logo_url: string | null; logo_choice: string | null };
export type HeartbeatItem = { id: string; slug: string; kind: 'event' | 'opportunity'; title: string; date: string; city: string | null; orgs: HeartbeatOrg[] };
export type HeartbeatData = { items: HeartbeatItem[]; now: string };
export type Beat = { day: number; amp: number; items: HeartbeatItem[]; resting: false };
export type RestBeat = { day: number; amp: number; resting: true };

export const HORIZON = 35;
const WIDTH = 0.9;
const g = (u: number, m: number, s: number) => Math.exp(-((u - m) ** 2) / (2 * s * s));
export function pqrst(u: number) {
  return 0.12 * g(u, -0.55, 0.08) - 0.10 * g(u, -0.12, 0.03) + g(u, 0, 0.035) - 0.28 * g(u, 0.11, 0.035) + 0.22 * g(u, 0.5, 0.12);
}

/** Calendar key of a date in the visitor's time zone; date-only values stay that calendar day. */
export function localKey(value: string): string {
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayOffset(key: string, todayKey: string) {
  return Math.round((Date.parse(`${key}T12:00:00Z`) - Date.parse(`${todayKey}T12:00:00Z`)) / 86_400_000);
}
export function beatAmplitude(items: Pick<HeartbeatItem, 'kind'>[]) {
  if (!items.length) return 0;
  const base = items.some(item => item.kind === 'opportunity') ? 5.4 : 4.6;
  return Math.min(8, base + 0.9 * (items.length - 1));
}
export function buildBeats(items: HeartbeatItem[], todayKey: string): Beat[] {
  const days = new Map<number, HeartbeatItem[]>();
  for (const item of items) {
    const key = localKey(item.date); if (!key) continue;
    const day = dayOffset(key, todayKey);
    if (day < 0 || day > HORIZON) continue;
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  return [...days].sort((a, b) => a[0] - b[0]).map(([day, list]) => ({ day, amp: beatAmplitude(list), items: list, resting: false }));
}
/** Resting beats every 1.15 days wherever no real beat is within 1 day. */
export function restingBeats(beats: { day: number }[], from = -2, to = HORIZON + 14): RestBeat[] {
  const rest: RestBeat[] = [];
  for (let day = from; day <= to; day += 1.15) {
    if (!beats.some(beat => Math.abs(beat.day - day) < 1)) rest.push({ day: Math.round(day * 100) / 100, amp: 0.6, resting: true });
  }
  return rest;
}
export function heightAt(day: number, beats: { day: number; amp: number }[]) {
  let total = 0;
  for (const beat of beats) {
    const u = (day - beat.day) / WIDTH;
    if (Math.abs(u) < 1) total += beat.amp * pqrst(u);
  }
  return total;
}
export const smoothstep = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Maps scroll fraction (0..1) to a day between from and to; time moves at `slow` speed when a beat is within `ahead` days. */
export function warpedDay(f: number, from: number, to: number, beats: { day: number }[], slow = 0.4, ahead = 1.5, steps = 240) {
  if (to <= from) return from;
  const step = (to - from) / steps, cost: number[] = [0];
  for (let i = 0; i < steps; i++) {
    const mid = from + (i + 0.5) * step;
    const near = beats.some(b => b.day >= mid && b.day - mid <= ahead);
    cost.push(cost[i] + step / (near ? slow : 1));
  }
  const goal = clamp01(f) * cost[steps];
  let i = 0; while (i < steps && cost[i + 1] < goal) i++;
  const seg = cost[i + 1] - cost[i];
  return from + (i + (seg > 0 ? (goal - cost[i]) / seg : 0)) * step;
}
