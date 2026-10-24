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
  it('scores relation 100, city 30, type 20, field 10 each, country 5; top 6 with strongest reason', () => {
    const self = { id: 'self', city: 'Oulu', type: 'investor', fieldNames: { med: 'Medtech', ai: 'AI' }, countryNames: { fi: 'Finland' }, relations: { r: 'Partner' } };
    const rows = [
      { id: 'country', title: 'Country', city: null, fieldIds: [], countryIds: ['fi'] }, // 5
      { id: 'f2', title: 'Two fields', city: null, fieldIds: ['med', 'ai'] }, // 20
      { id: 't', title: 'Type', city: null, type: 'investor', fieldIds: [] }, // 20
      { id: 'c', title: 'City', city: 'Oulu', fieldIds: [] }, // 30
      { id: 'r', title: 'Rel', city: null, fieldIds: [] }, // 100
      { id: 'cf', title: 'City field', city: 'Oulu', fieldIds: ['med'] }, // 40
      { id: 'none', title: 'None', city: 'Turku', fieldIds: [] },
      ...Array.from({ length: 3 }, (_, i) => ({ id: `y${i}`, title: `Y${i}`, city: null, fieldIds: [], countryIds: ['fi'] })),
    ];
    const out = closeToThem(rows, self);
    expect(out).toHaveLength(6);
    expect(out.map(o => [o.id, o.score])).toEqual([['r', 100], ['cf', 40], ['c', 30], ['t', 20], ['f2', 20], ['country', 5]]);
    expect(out.map(o => o.reason)).toEqual(['Partner', 'Also in Oulu', 'Also in Oulu', 'Also an investor', 'Same field: Medtech', 'Also in Finland']);
  });
});
