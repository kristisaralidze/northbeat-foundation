import { describe, expect, it } from 'vitest';
import { happeningItems, networkScrollPhases } from './home-story';
import type { EventsData } from './events';
import type { OpportunitiesData } from './opportunities';
describe('home scroll progress', () => {
  it('gathers dots over the first 40 percent', () => {
    expect(networkScrollPhases(.2, 10)).toEqual({ entry: .5, connections: 0, labels: 0 });
    expect(networkScrollPhases(.4, 10).entry).toBe(1);
  });
  it('draws connections between 40 and 80 percent', () => {
    expect(networkScrollPhases(.6, 10).connections).toBeCloseTo(5);
    expect(networkScrollPhases(.8, 10).connections).toBe(10);
  });
  it('reveals labels between 80 and 100 percent and reverses', () => {
    expect(networkScrollPhases(.9, 10).labels).toBeCloseTo(.5);
    expect(networkScrollPhases(1, 10).labels).toBeCloseTo(1);
    expect(networkScrollPhases(.8, 10).labels).toBe(0);
  });
  it('shows all phases immediately for reduced motion', () => {
    expect(networkScrollPhases(0, 10, true)).toEqual({ entry: 1, connections: 10, labels: 1 });
  });
  it('keeps only upcoming dated events and deadlines, nearest first', () => {
    const events = { now: '2026-10-19T18:39:00Z', events: [
      { id: 'past', slug: 'past', title: 'Past', starts_at: '2026-10-18', event_type: 'conference' },
      { id: 'future', slug: 'future', title: 'Future', starts_at: '2026-11-18', apply_deadline_at: '2026-10-28', event_type: 'conference' },
    ], opportunities: [] } as EventsData;
    const opportunities = { now: events.now, opportunities: [
      { id: 'grant', slug: 'grant', title: 'Grant', deadline_at: '2027-01-14', type: 'grant_call' },
      { id: 'rolling', slug: 'rolling', title: 'Rolling', deadline_at: null, type: 'programme_intake' },
    ], terms: [] } as OpportunitiesData;
    expect(happeningItems(events, opportunities).map(i => i.id)).toEqual(['application:future', 'event:future', 'opportunity:grant']);
  });
});