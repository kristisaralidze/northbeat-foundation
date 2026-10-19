import { describe, expect, it } from 'vitest';
import { amountLabel, deadlineLabel, filterOpportunities, isRolling, type OpportunitiesData, type OpportunityRow } from './opportunities';

const NOW = '2026-10-19T09:00:00Z';
const FIELD = { id: 'f1', kind: 'field', name: 'Medtech', slug: 'medtech', parent_id: null, sort_order: 1 };
const STAGE = { id: 's1', kind: 'stage', name: 'Seed', slug: 'seed', parent_id: null, sort_order: 1 };

function row(partial: Partial<OpportunityRow>): OpportunityRow {
  return { id: 'x', slug: 'x', title: 'X', type: 'grant_call', summary: null, opens_at: null, deadline_at: null, amount_min_eur: null, amount_max_eur: null, location: null, employment_type: null, remote_ok: null, termIds: [], ...partial };
}
function data(opportunities: OpportunityRow[]): OpportunitiesData {
  return { opportunities, terms: [FIELD, STAGE], now: NOW };
}
const OPEN = { type: '', field: '', stage: '', archive: false };

describe('filterOpportunities', () => {
  it('sorts open opportunities by nearest deadline, undated last', () => {
    const soon = row({ id: 'a', deadline_at: '2026-10-25T00:00:00Z' });
    const later = row({ id: 'b', deadline_at: '2026-12-01T00:00:00Z' });
    const undated = row({ id: 'c' });
    expect(filterOpportunities(data([undated, later, soon]), OPEN).map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });
  it('moves past deadlines to the archive', () => {
    const closed = row({ id: 'a', deadline_at: '2026-10-01T00:00:00Z' });
    const open = row({ id: 'b', deadline_at: '2026-11-01T00:00:00Z' });
    expect(filterOpportunities(data([closed, open]), OPEN).map((o) => o.id)).toEqual(['b']);
    expect(filterOpportunities(data([closed, open]), { ...OPEN, archive: true }).map((o) => o.id)).toEqual(['a']);
  });
  it('filters by type, field and stage together', () => {
    const match = row({ id: 'a', type: 'job', termIds: ['f1', 's1'] });
    const wrongType = row({ id: 'b', type: 'grant_call', termIds: ['f1', 's1'] });
    const wrongField = row({ id: 'c', type: 'job', termIds: ['s1'] });
    const wrongStage = row({ id: 'd', type: 'job', termIds: ['f1'] });
    const result = filterOpportunities(data([match, wrongType, wrongField, wrongStage]), { ...OPEN, type: 'job', field: 'medtech', stage: 'seed' });
    expect(result.map((o) => o.id)).toEqual(['a']);
  });
});

describe('amountLabel', () => {
  it('formats ranges, one-sided amounts and empty amounts', () => {
    expect(amountLabel(row({ amount_min_eur: 10000, amount_max_eur: 50000 }))).toBe('€10,000–€50,000');
    expect(amountLabel(row({ amount_min_eur: 25000, amount_max_eur: 25000 }))).toBe('€25,000');
    expect(amountLabel(row({ amount_max_eur: 5000 }))).toBe('Up to €5,000');
    expect(amountLabel(row({}))).toBe('');
  });
});

describe('deadlineLabel', () => {
  it('counts down days and marks closed deadlines', () => {
    expect(deadlineLabel(row({ deadline_at: '2026-10-19T12:00:00Z' }), NOW)).toBe('Closes today');
    expect(deadlineLabel(row({ deadline_at: '2026-10-25T00:00:00Z' }), NOW)).toBe('25 Oct 2026 · 6 days left');
    expect(deadlineLabel(row({ deadline_at: '2026-10-01T00:00:00Z' }), NOW)).toBe('Closed 1 Oct 2026');
  });
  it('recognises continuous calls and rolling programmes from existing timing notes', () => {
    expect(isRolling(row({ type: 'grant_call', description: 'Continuous application. No fixed deadline.' }))).toBe(true);
    expect(isRolling(row({ type: 'programme_intake', description: 'Rolling applications accepted year-round.' }))).toBe(true);
    expect(isRolling(row({ type: 'programme_intake', description: 'Intake dates not yet announced.' }))).toBe(false);
    expect(isRolling(row({ type: 'programme_intake' }))).toBe(false);
  });
});
