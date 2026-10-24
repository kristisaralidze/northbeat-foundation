export type HeartbeatOrg = {slug?:string;logo_resolved_url?:string|null;logo_tone?:string|null;logo_status?:string|null; name: string; website: string | null; logo_url: string | null; logo_choice: string | null };
export type HeartbeatItem = { id: string; slug: string; kind: 'event' | 'opportunity'; title: string; date: string; city: string | null; website?: string | null; orgs: HeartbeatOrg[] };
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
    cost.push(cost[i]! + step / (near ? slow : 1));
  }
  const goal = clamp01(f) * cost[steps]!;
  let i = 0; while (i < steps && cost[i + 1]! < goal) i++;
  const seg = cost[i + 1]! - cost[i]!;
  return from + (i + (seg > 0 ? (goal - cost[i]!) / seg : 0)) * step;
}

/** Spike height by meaning: one event 3, one deadline 4, two items 4.5, three or more 5.5. */
export const REST_HEIGHT = 0.5;
export function beatHeight(items: Pick<HeartbeatItem, 'kind'>[]) {
  if (!items.length) return REST_HEIGHT;
  if (items.length >= 3) return 5.5;
  if (items.length === 2) return 4.5;
  return items[0]?.kind === 'opportunity' ? 4 : 3;
}
/** Scroll stops: start, one per beat at day - 0.8, then the end. Each stop gets an equal share. */
export function buildStops(beats: { day: number }[], start: number, end: number) {
  const stops = [start, ...beats.map(b => b.day - 0.8).filter(d => d > start && d < end), end];
  return stops.filter((d, i) => i === 0 || d > stops[i - 1]!);
}
export function dayAtProgress(f: number, stops: number[]) {
  if (stops.length < 2) return stops[0] ?? 0;
  const x = clamp01(f) * (stops.length - 1); const i = Math.min(stops.length - 2, Math.floor(x));
  return stops[i]! + (stops[i + 1]! - stops[i]!) * smoothstep(x - i);
}
/** Section height in vh: 100 + 70 per beat, between 300 and 650. */
export const sectionHeightVh = (beats: number) => Math.max(300, Math.min(650, 100 + 70 * beats));
/** Scale so the tallest spike, resting `ahead` days in front of the camera, uses at most `share` of the screen. */
export function heightScale(maxH: number, H: number, F: number, zAt: number, share = 0.4) {
  if (maxH <= 0) return 1;
  return Math.min(1, (share * H * zAt) / (F * maxH));
}

export type MergedBeat = Beat & { endDay: number };
const prominence = (i: HeartbeatItem) => i.orgs.length * 2 + (i.kind === 'event' ? 1 : 0);
/** Merge beats one day apart or less into one moment; items ordered most prominent first. */
export function mergeBeats(beats: Beat[]): MergedBeat[] {
  const out: MergedBeat[] = [];
  for (const b of [...beats].sort((a, c) => a.day - c.day)) {
    const last = out[out.length - 1];
    if (last && b.day - last.endDay <= 1) { last.items = [...last.items, ...b.items]; last.endDay = b.day; }
    else out.push({ ...b, items: [...b.items], endDay: b.day });
  }
  return out.map(b => ({ ...b, items: [...b.items].sort((a, c) => prominence(c) - prominence(a)) }));
}
/** "Slush 2026 + 4 more". */
export const beatTitle = (titles: string[]) => (titles[0] ?? '') + (titles.length > 1 ? ` + ${titles.length - 1} more` : '');
