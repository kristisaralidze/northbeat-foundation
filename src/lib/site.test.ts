import { describe, expect, it } from 'vitest';
import { addTag, longDate, newestDate, toCsv } from './site';

describe('site helpers', () => {
  it('footer shows the newest last checked date', () => {
    expect(newestDate(['2026-10-19', null, '2026-10-20', undefined])).toBe('2026-10-20');
    expect(newestDate([null])).toBeNull();
  });
  it('formats the updated date in words', () => { expect(longDate('2026-10-20')).toBe('20 October 2026'); });
  it('waitlist CSV has email and created_at columns and neutralises formulas', () => {
    expect(toCsv(['email', 'created_at'], [['a@b.fi', '2026-10-24'], ['=cmd', null]])).toBe('"email","created_at"\r\n"a@b.fi","2026-10-24"\r\n"\'=cmd",""');
  });
  it('podcast sign-ups get the podcast tag once', () => {
    expect(addTag([], 'podcast')).toEqual(['podcast']);
    expect(addTag(['podcast'], 'podcast')).toEqual(['podcast']);
    expect(addTag(['x'], undefined)).toEqual(['x']);
  });
});
