import { describe, expect, it } from 'vitest';
import { closingDays, timelineRows } from './timeline';
describe('public timelines', () => {
  it('highlights only deadlines within 14 days', () => {
    const now = '2026-10-19T19:00:00Z';
    expect(closingDays('2026-11-02T19:00:00Z', now)).toBe(14);
    expect(closingDays('2026-11-03T19:00:00Z', now)).toBeNull();
    expect(closingDays('2026-10-18T19:00:00Z', now)).toBeNull();
    expect(closingDays('2026-10-19T20:00:00Z', now)).toBe(0);
  });
  it('places Today between earlier and upcoming items and undated items last', () => {
    expect(timelineRows(['2026-10-18', null, '2026-10-20'], value => value, '2026-10-19').map(row => row.kind === 'today' ? 'Today' : row.item)).toEqual(['2026-10-18', 'Today', '2026-10-20', null]);
  });
});