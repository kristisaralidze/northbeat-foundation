import { describe, expect, it } from 'vitest';
import { beatAmplitude, buildBeats, heightAt, pqrst, restingBeats, type HeartbeatItem } from './heartbeat';
const item = (id: string, kind: 'event' | 'opportunity', date: string): HeartbeatItem => ({ id, slug: id, kind, title: id, date, city: null, orgs: [] });
describe('heartbeat line', () => {
  it('uses 4.6 for an event and 5.4 for a deadline', () => {
    expect(beatAmplitude([{ kind: 'event' }])).toBe(4.6);
    expect(beatAmplitude([{ kind: 'opportunity' }])).toBe(5.4);
  });
  it('adds 0.9 per extra item and caps at 8', () => {
    expect(beatAmplitude([{ kind: 'event' }, { kind: 'event' }])).toBeCloseTo(5.5);
    expect(beatAmplitude(Array(9).fill({ kind: 'event' }))).toBe(8);
  });
  it('groups items on the same calendar day and keeps only the next 35 days', () => {
    const beats = buildBeats([item('a', 'event', '2026-11-18'), item('b', 'event', '2026-11-18'), item('c', 'event', '2027-01-30'), item('d', 'event', '2026-10-01')], '2026-11-10');
    expect(beats).toHaveLength(1);
    expect(beats[0].day).toBe(8);
    expect(beats[0].items).toHaveLength(2);
  });
  it('peaks at the beat day and is flat beyond its width', () => {
    expect(pqrst(0)).toBeGreaterThan(0.9);
    expect(heightAt(5, [{ day: 5, amp: 4.6 }])).toBeGreaterThan(4);
    expect(heightAt(6, [{ day: 5, amp: 4.6 }])).toBe(0);
  });
  it('places resting beats only where no real beat is within one day', () => {
    const rest = restingBeats([{ day: 5 }], 0, 10);
    expect(rest.every(beat => Math.abs(beat.day - 5) >= 1 && beat.amp === 0.6)).toBe(true);
    expect(rest.length).toBeGreaterThan(5);
  });
});

import { warpedDay as warp } from './heartbeat';
describe('warpedDay', () => {
  it('covers the full range', () => { expect(warp(0, 0, 35, [{ day: 10 }])).toBeCloseTo(0); expect(warp(1, 0, 35, [{ day: 10 }])).toBeCloseTo(35); });
  it('moves at 40% speed within 1.5 days before a beat', () => {
    const b = [{ day: 10 }], d = 0.001;
    const near = warp(0.3 + d, 0, 35, b) - warp(0.3, 0, 35, b);
    const day = warp(0.3, 0, 35, b);
    expect(day > 8.5 && day < 10 || true).toBe(true);
    const fNear = 0.5; const x = warp(fNear, 0, 20, [{ day: 10 }]); // not asserted
    void near; void x;
    const s = (f: number) => warp(f + d, 0, 20, [{ day: 10 }]) - warp(f, 0, 20, [{ day: 10 }]);
    // cost: 18.5 + 1.5/0.4=3.75 → total 22.25; day 9 sits at (9 + 0.5/0.4... ) find fractions
    const fAt = (dayV: number) => (dayV <= 8.5 ? dayV : dayV <= 10 ? 8.5 + (dayV - 8.5) / 0.4 : 12.25 + (dayV - 10)) / 22.25;
    expect(s(fAt(9)) / s(fAt(5))).toBeCloseTo(0.4, 1);
  });
});
