import { describe, it, expect } from 'vitest';
import { buildNetwork, ECOSYSTEM_GROUPS, layoutNetwork, networkGroup, networkTiming, profileHref, type NetworkEntry } from './ecosystem';

const entry = (id: string, kind: NetworkEntry['kind'] = 'organisation', status = 'published', type = 'startup'): NetworkEntry => ({ id, slug: id, name: id, type, kind, status });
describe('published ecosystem', () => {
  it('includes every published organisation, event and opportunity, including isolated entries', () => {
    const graph = buildNetwork([entry('a'), entry('b', 'event'), entry('c', 'opportunity'), entry('hidden', 'organisation', 'draft')], []);
    expect(graph.nodes.map(n => n.id)).toEqual(['organisation:a', 'event:b', 'opportunity:c']);
  });
  it('omits relationships with unpublished or absent endpoints', () => {
    const graph = buildNetwork([entry('a'), entry('b', 'organisation', 'draft')], [{ source: 'organisation:a', target: 'organisation:b', relation: 'invested_in' }]);
    expect(graph.links).toHaveLength(0);
  });
  it('keeps the four requested relationships and never invents connections', () => {
    const edges = ['invested_in', 'partner_of', 'organiser_of', 'provider_of', 'acquired'].map(relation => ({ source: 'organisation:a', target: 'organisation:b', relation }));
    expect(buildNetwork([entry('a'), entry('b')], edges).links.map(e => e.relation)).toEqual(['invested_in', 'partner_of', 'organiser_of', 'provider_of']);
  });
  it('deduplicates reciprocal partner links', () => {
    expect(buildNetwork([entry('a'), entry('b')], [{ source: 'organisation:a', target: 'organisation:b', relation: 'partner_of' }, { source: 'organisation:b', target: 'organisation:a', relation: 'partner_of' }]).links).toHaveLength(1);
  });
  it('keeps all eleven legend groups even when empty', () => {
    expect(ECOSYSTEM_GROUPS).toEqual(['Startups', 'Investors', 'Incubators and accelerators', 'Funders and grants', 'Universities and research groups', 'Labs and validation partners', 'Hospitals and care providers', 'Public agencies', 'Patient organisations', 'Communities and events', 'Service providers']);
  });
  it('groups grants, programmes, events and care providers correctly', () => {
    expect(networkGroup('opportunity', 'grant_call')).toBe(3);
    expect(networkGroup('opportunity', 'programme_intake')).toBe(2);
    expect(networkGroup('event', 'conference')).toBe(9);
    expect(networkGroup('organisation', 'care_provider')).toBe(6);
  });
  it('keeps every node within phone bounds and resolves its real profile', () => {
    const graph = buildNetwork(Array.from({ length: 31 }, (_, i) => entry(String(i))), []);
    const nodes = layoutNetwork(graph, 390, 500);
    expect(nodes).toHaveLength(31);
    for (const n of nodes) { expect(n.x).toBeGreaterThanOrEqual(29); expect(n.x).toBeLessThanOrEqual(361); expect(n.y).toBeGreaterThanOrEqual(29); expect(n.y).toBeLessThanOrEqual(471); }
    const first = nodes[0]; if (!first) throw new Error('Missing node');
    expect(profileHref(first)).toBe('/org/0');
  });
  it('settles nodes before sequential connection drawing', () => {
    expect(networkTiming(2499, false, 4).connections).toBe(0);
    expect(networkTiming(2640, false, 4)).toEqual({ entry: 1, connections: 1 });
  });
  it('shows the final state immediately for reduced motion', () => {
    expect(networkTiming(0, true, 4)).toEqual({ entry: 1, connections: 4 });
  });
});