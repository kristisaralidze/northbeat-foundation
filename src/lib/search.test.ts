import { describe, expect, it } from 'vitest';
import { pushRecent, searchAll, itemHref, type SearchItem } from './search';
const item = (p: Partial<SearchItem>): SearchItem => ({ kind: 'organisation', slug: 's', title: 'T', line: null, type: null, city: null, date: null, end: null, logo: null, website: null, logoChoice: null, amountMin: null, amountMax: null, online: false, ...p });
describe('search everything', () => {
  it('groups by type and ranks title starts first', () => {
    const out = searchAll([item({ title: 'Health Hub' }), item({ title: 'Aalto Health', slug: 'a' }), item({ kind: 'event', title: 'Health Day' })], 'health');
    expect(out.map(g => g.kind)).toEqual(['organisation', 'event']);
    expect(out[0]!.items[0]!.title).toBe('Health Hub');
  });
  it('remembers the last 5 searches, newest first, no duplicates', () => {
    expect(pushRecent(['a', 'b', 'c', 'd', 'e'], 'f')).toEqual(['f', 'a', 'b', 'c', 'd']);
    expect(pushRecent(['a', 'b'], 'B')).toEqual(['B', 'a']);
  });
  it('links glossary terms to their anchor', () => { expect(itemHref({ kind: 'glossary', slug: 'ce-mark' })).toBe('/learn/glossary#ce-mark'); });
});
