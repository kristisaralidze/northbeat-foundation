import { describe, expect, it } from 'vitest';
import { parseCompanies, parseFeed, parseInstitutions, parseTrials, researchSummary, trialPhase } from './enrich';

describe('open data parsers', () => {
  it('keeps only the top 3 institution matches', () => {
    const results = Array.from({ length: 5 }, (_, i) => ({ id: `https://openalex.org/I${i + 1}`, display_name: `U${i}`, country_code: 'FI', ror: 'https://ror.org/x' }));
    expect(parseInstitutions({ results }).map(r => r.id)).toEqual(['I1', 'I2', 'I3']);
  });
  it('keeps the last 10 years and top 5 topics', () => {
    const r = researchSummary({ works_count: 9, cited_by_count: 4, counts_by_year: [{ year: 2026, works_count: 7 }, { year: 2010, works_count: 3 }], topics: Array.from({ length: 7 }, (_, i) => ({ display_name: `T${i}` })) }, 2026);
    expect(r.counts_by_year).toHaveLength(10);
    expect(r.counts_by_year[0]).toEqual({ year: 2017, works: 0 });
    expect(r.counts_by_year[9]).toEqual({ year: 2026, works: 7 });
    expect(r.topics).toEqual(['T0', 'T1', 'T2', 'T3', 'T4']);
  });
  it('parses trials and phases', () => {
    const [t] = parseTrials({ studies: [{ protocolSection: { identificationModule: { nctId: 'NCT03440021', briefTitle: 'X' }, statusModule: { overallStatus: 'RECRUITING', startDateStruct: { date: '2018-03' } }, designModule: { phases: ['PHASE1', 'PHASE2'] } } }] });
    expect(t?.status).toBe('RECRUITING');
    expect(trialPhase(t?.phase ?? null)).toBe('Phase 1, Phase 2');
  });
  it('uses the current registered name and English descriptions', () => {
    const [c] = parseCompanies({ companies: [{ businessId: { value: '2542776-4' }, registrationDate: '2013-04-24', names: [{ name: 'Old Oy', type: '1', endDate: '2017-03-27' }, { name: 'Oura Health Oy', type: '1' }], companyForms: [{ descriptions: [{ languageCode: '1', description: 'Osakeyhtiö' }, { languageCode: '3', description: 'Limited company' }] }], addresses: [{ postOffices: [{ city: 'OULU' }] }] }] });
    expect(c).toMatchObject({ businessId: '2542776-4', name: 'Oura Health Oy', companyForm: 'Limited company', municipality: 'Oulu', registrationDate: '2013-04-24' });
  });
  it('keeps only the 3 newest headlines with title and link', () => {
    const items = [1, 2, 3, 4].map(d => `<item><title>News ${d}</title><link>/n/${d}</link><pubDate>2026-10-0${d}T00:00:00Z</pubDate><description>Body text</description></item>`).join('');
    const feed = parseFeed(`<rss><channel>${items}</channel></rss>`, 'https://example.fi/feed');
    expect(feed.map(f => f.title)).toEqual(['News 4', 'News 3', 'News 2']);
    expect(feed[0]).toEqual({ title: 'News 4', date: '2026-10-04T00:00:00.000Z', link: 'https://example.fi/n/4' });
  });
});
