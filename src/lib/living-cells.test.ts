import { describe, expect, it } from 'vitest';
import { CELL_GROUPS, CELL_LINKS, cellHref, cellPulse, dotPosition, dotScale, layoutCells, layoutLabels, membraneRadius, rectCellOverlap, rectOverlap, relationSentence, safeCellData, type CellData } from './living-cells';
const org = (id: string, type = 'startup', status = 'published') => ({ id, slug: id, name: id, type, status, website: null, logo_url: null, logo_choice: null });
describe('living cells data', () => {
  it('has exactly the eleven requested groups in order', () => {
    expect(CELL_GROUPS.map(g => g.name)).toEqual(['Startups', 'Investors', 'Funders and grants', 'Incubators and accelerators', 'Universities and research', 'Hospitals and care', 'Labs and validation', 'Public agencies', 'Patient organisations', 'Service providers', 'Communities and events']);
  });
  it('keeps one dot per published organisation and no draft or event dot', () => {
    const data = safeCellData({ organisations: [org('a'), org('b'), org('draft', 'startup', 'draft'), org('event', 'conference')], relations: [] });
    expect(data.organisations.map(o => o.id)).toEqual(['a', 'b']);
    expect(layoutCells(data, 1440, 560).map(c => c.orgs.length)).toEqual([2]);
  });
  it('only keeps actual relations with two published endpoints, including spinouts and acquisitions', () => {
    const relations = [{ from_org_id: 'a', to_org_id: 'b', relation: 'spun_out_of' }, { from_org_id: 'b', to_org_id: 'a', relation: 'acquired' }, { from_org_id: 'a', to_org_id: 'draft', relation: 'partner_of' }];
    expect(safeCellData({ organisations: [org('a'), org('b'), org('draft', 'startup', 'draft')], relations }).relations).toEqual(relations.slice(0, 2));
  });
  it('keeps all 32 supplied conceptual sentences separate from real relations', () => {
    expect(CELL_LINKS).toHaveLength(32);
    expect(CELL_LINKS[0]?.sentence).toBe('investors invest in startups');
    expect(CELL_LINKS[31]?.sentence).toBe('service providers teach at incubators');
    expect(safeCellData({ organisations: [org('a'), org('b', 'investor')], relations: [] }).relations).toEqual([]);
  });
  it('links combined groups to the canonical Explore type filter', () => {
    expect(cellHref(3)).toBe('/explore?type=%5B%22incubator%22%2C%22accelerator%22%5D');
  });
  it('uses directional real relation sentences', () => {
    const r = { from_org_id: 'company', to_org_id: 'uni', relation: 'spun_out_of' };
    expect(relationSentence(r, 'company', new Map([['uni', 'University of Helsinki']]))).toBe('Spun out of University of Helsinki');
  });
});
describe('living cell geometry and motion', () => {
  const counts = [59, 14, 4, 12, 14, 2, 1, 3, 1, 4, 5];
  const data: CellData = { organisations: CELL_GROUPS.flatMap((g, i) => Array.from({ length: counts[i] ?? 1 }, (_, n) => org(`${i}-${n}`, g.types[0]))), relations: [] };
  it('uses the exact ellipse and keeps startups in the centre', () => {
    const cells = layoutCells(data, 1440, 560);
    expect(cells[0]?.x).toBe(720); expect(cells[0]?.y).toBe(298);
    expect(cells[1]?.y).toBeCloseTo(298 - .31 * 560);
    expect(cells[1]?.x).toBeCloseTo(720);
  });
  it('packs sunflower dots with stable sizes from .75 to 1.35', () => {
    const cell = layoutCells(data, 1440, 560)[0]; if (!cell) throw new Error('Missing startups');
    const p = dotPosition(cell, 0, 0);
    expect(p.x - cell.x).toBeCloseTo(.56 * 2.8 * 2.8 * Math.sqrt(.5) + 17);
    for (const o of data.organisations) { expect(dotScale(o.id)).toBeGreaterThanOrEqual(.75); expect(dotScale(o.id)).toBeLessThanOrEqual(1.35); expect(dotScale(o.id)).toBe(dotScale(o.id)); }
  });
  it('pulses every 3.2 seconds with .55s travel and .5s swell, never in reduced motion', () => {
    expect(cellPulse(.25, 0)).toBeCloseTo(1); expect(cellPulse(.8, 1)).toBeCloseTo(1);
    expect(cellPulse(3.45, 0)).toBeCloseTo(1); expect(cellPulse(.8, 1, true)).toBe(0);
    expect(cellPulse(1.1, 1)).toBe(0);
  });
  it('uses the specified three membrane waves', () => {
    expect(membraneRadius(50, 0, 0, 1)).toBeCloseTo(50 * (1 + .045 * Math.sin(1) + .03 * Math.sin(2.3)));
  });
  it.each([[390, 500], [350, 500], [1360, 560]])('keeps all eleven measured labels clear and inside %ipx canvas', (w, h) => {
    const cells = layoutCells(data, w, h), labels = layoutLabels(cells, w, h, s => s.length * (w < 600 ? 5 : 6));
    expect(labels).toHaveLength(11);
    labels.forEach((l, i) => { expect(l.x).toBeGreaterThanOrEqual(0); expect(l.x + l.width).toBeLessThanOrEqual(w); expect(l.y + l.height).toBeLessThan(h - 35); expect(cells.some(c => rectCellOverlap(l, c))).toBe(false); expect(labels.slice(i + 1).some(b => rectOverlap(l, b))).toBe(false); });
  });
});