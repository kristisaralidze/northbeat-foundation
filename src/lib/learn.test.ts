import { describe, expect, it } from 'vitest';
import { areaNeighbours, groupGlossary, parseSources, sharesHub, rankHub, type GuideCard } from './learn';

const g = (id: string, area: string | null, step: string | null, title = id): GuideCard => ({ id, slug: id, title, one_sentence: null, level: 'beginner', reading_minutes: null, area_id: area, journey_step_id: step });

describe('learn', () => {
  it('limits the cross-type recommendation shortlist to five entries', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ title: String(i), termIds: ['step1'] }));
    expect(rankHub(items, 'step1', [])).toHaveLength(5);
  });
  it('ranks the same journey step first, then shared fields', () => {
    const items = [{ title: 'Field only', termIds: ['field1'] }, { title: 'Step only', termIds: ['step1'] }, { title: 'Both', termIds: ['step1', 'field1'] }, { title: 'Unrelated', termIds: ['other'] }];
    expect(rankHub(items, 'step1', ['field1']).map(item => item.title)).toEqual(['Both', 'Step only', 'Field only']);
  });
  it('in the hub needs the same journey step', () => {
    expect(sharesHub(['field1'], 'step1')).toBe(false);
    expect(sharesHub(['step1'], 'step1')).toBe(true);
    expect(sharesHub(['step1'], null)).toBe(false);
  });
  it('in the hub matches the journey step regardless of field tags', () => {
    expect(sharesHub(['step1', 'field2'], 'step1')).toBe(true);
    expect(sharesHub(['step1'], 'step1')).toBe(true);
    expect(sharesHub(['step2', 'field1'], 'step1')).toBe(false);
  });
  it('previous and next stay within the same area, in journey order', () => {
    const order = new Map([['s1', 0], ['s2', 1]]);
    const list = [g('late', 'a', 's2'), g('other', 'b', 's1'), g('early', 'a', 's1')];
    expect(areaNeighbours(list, 'early', order)).toEqual({ previous: null, next: { slug: 'late', title: 'late' } });
    expect(areaNeighbours(list, 'other', order)).toEqual({ previous: null, next: null });
  });
  it('drops sources without a title or a web link', () => {
    expect(parseSources([{ title: 'A', url: 'https://a.fi' }, { title: '', url: 'https://b.fi' }, { title: 'C', url: 'javascript:x' }])).toEqual([{ title: 'A', url: 'https://a.fi/' }]);
  });
  it('glossary groups A to Z and searches definitions', () => {
    const terms = [{ term: 'Seed', short_definition: 'Early money' }, { term: 'CE mark', short_definition: 'EU approval' }];
    expect(groupGlossary(terms).map((x) => x.letter)).toEqual(['C', 'S']);
    expect(groupGlossary(terms, 'money').map((x) => x.terms[0]?.term)).toEqual(['Seed']);
  });
});
