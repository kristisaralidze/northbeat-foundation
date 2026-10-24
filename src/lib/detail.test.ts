import { describe, it, expect } from 'vitest';
import { daysUntil, withinSevenDays, nearbyFirst, eventCalendar } from './detail';
describe('detail date and recommendation rules', () => {
  it('counts calendar days in the event timezone', () => { expect(daysUntil('2026-11-18T08:00:00Z', '2026-10-20T06:27:00Z')).toBe(29); expect(daysUntil(null, '2026-10-20')).toBeNull(); });
  it('includes seven days but excludes eight days from same-week recommendations', () => { expect(withinSevenDays('2026-11-25T08:00:00Z', '2026-11-18T08:00:00Z')).toBe(true); expect(withinSevenDays('2026-11-26T08:00:00Z', '2026-11-18T08:00:00Z')).toBe(false); });
  it('caps similar organisations at four and puts the same city first', () => { const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: String(i), city: i === 5 ? 'Helsinki' : 'Turku', countryIds: ['fi'] })); const result = nearbyFirst(rows, 'Helsinki', ['fi']); expect(result).toHaveLength(4); expect(result[0]?.id).toBe('5'); });
  it('exports a valid UTC event range and escapes calendar text', () => { const value = eventCalendar({ id: 'slush', title: 'Slush, 2026', start: '2026-11-18T08:00:00Z', end: '2026-11-19T16:00:00Z', location: 'Helsinki', description: 'Meet; founders', url: 'https://slush.org' }); expect(value).toContain('DTSTART:20261118T080000Z'); expect(value).toContain('DTEND:20261119T160000Z'); expect(value).toContain('SUMMARY:Slush\\, 2026'); });
});import { countdownLabel, withinDays, registrationClosed, closeToThem } from './detail';
describe('action-first detail rules', () => {
  it('labels countdowns', () => {
    expect(countdownLabel('2026-11-18T08:00:00Z', '2026-10-24T08:00:00Z')).toBe('In 25 days');
    expect(countdownLabel('2026-10-24T15:00:00Z', '2026-10-24T08:00:00Z')).toBe('Today');
    // Wed 21 Oct 2026 -> Sat 24 Oct
    expect(countdownLabel('2026-10-24T10:00:00Z', '2026-10-21T08:00:00Z')).toBe('This weekend');
    expect(countdownLabel('2026-10-01T10:00:00Z', '2026-10-21T08:00:00Z')).toBeNull();
  });
  it('same week means 3 days before or after', () => {
    expect(withinDays('2026-11-21T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(true);
    expect(withinDays('2026-11-22T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(false);
    expect(withinDays('2026-11-15T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(true);
  });
  it('closes registration after the deadline, or after the start without one', () => {
    expect(registrationClosed('2026-10-20T00:00:00Z', '2026-11-01T00:00:00Z', '2026-10-24T00:00:00Z')).toBe(true);
    expect(registrationClosed(null, '2026-11-01T00:00:00Z', '2026-10-24T00:00:00Z')).toBe(false);
    expect(registrationClosed(null, null, '2026-10-24T00:00:00Z')).toBe(false);
  });
  it('ranks relation, then field, then city, max 6, with reasons', () => {
    const rows = [{ id: 'c', title: 'C', city: 'Oulu', fieldIds: [] }, { id: 'f', title: 'F', city: null, fieldIds: ['med'] }, { id: 'r', title: 'R', city: null, fieldIds: [] }, ...Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, title: `X${i}`, city: 'Oulu', fieldIds: [] }))];
    const out = closeToThem(rows, { id: 'self', city: 'Oulu', fieldNames: { med: 'Medtech' }, relations: { r: 'Partner' } });
    expect(out).toHaveLength(6);
    expect(out.slice(0, 3).map(o => o.reason)).toEqual(['Partner', 'Same field: Medtech', 'Also in Oulu']);
  });
});
