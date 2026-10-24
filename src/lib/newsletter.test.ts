import { describe, expect, it } from 'vitest';
import { entryPath, issueLabel, sortIssues } from './newsletter';

describe('issueLabel', () => {
  it('labels issues by number', () => {
    expect(issueLabel({ issue_number: 12 })).toBe('Issue 12');
    expect(issueLabel({ issue_number: null })).toBe('Issue');
  });
});

describe('sortIssues', () => {
  it('orders newest first, falling back to issue number', () => {
    const older = { id: 'a', sent_on: '2026-01-05', issue_number: 1 };
    const newer = { id: 'b', sent_on: '2026-02-02', issue_number: 2 };
    const undatedHigh = { id: 'c', sent_on: null, issue_number: 9 };
    const undatedLow = { id: 'd', sent_on: null, issue_number: 3 };
    expect(sortIssues([older, undatedLow, newer, undatedHigh]).map((i) => i.id)).toEqual(['b', 'a', 'c', 'd']);
  });
});

describe('entryPath', () => {
  it('maps entry kinds to public routes and rejects kinds without one', () => {
    expect(entryPath('organisation')).toBe('/org');
    expect(entryPath('person')).toBe('/person');
    expect(entryPath('episode')).toBe('/podcast');
    expect(entryPath('guide')).toBeNull();
    expect(entryPath('newsletter_issue')).toBeNull();
  });
});

import { issuePreview } from './newsletter';
import { describe as dP, it as iP, expect as eP } from 'vitest';
dP('issuePreview', () => {
  iP('picks the 2 newest startups, 2 nearest future deadlines and next 2 events', () => {
    const now = '2026-10-24T12:00:00Z';
    const orgs = [
      { slug: 'old', type: 'startup', published_at: '2026-01-01T00:00:00Z' },
      { slug: 'new', type: 'startup', published_at: '2026-10-20T00:00:00Z' },
      { slug: 'mid', type: 'startup', published_at: '2026-06-01T00:00:00Z' },
      { slug: 'inv', type: 'investor', published_at: '2026-10-23T00:00:00Z' },
    ];
    const calls = [{ slug: 'past', deadline_at: '2026-10-01' }, { slug: 'far', deadline_at: '2027-01-01' }, { slug: 'soon', deadline_at: '2026-11-01' }, { slug: 'next', deadline_at: '2026-12-01' }, { slug: 'roll', deadline_at: null }];
    const events = [{ slug: 'gone', starts_at: '2026-10-01T09:00:00Z', ends_at: null }, { slug: 'b', starts_at: '2026-12-01T09:00:00Z', ends_at: null }, { slug: 'a', starts_at: '2026-11-01T09:00:00Z', ends_at: null }, { slug: 'c', starts_at: '2027-01-01T09:00:00Z', ends_at: null }];
    const p = issuePreview(orgs, calls, events, now);
    eP(p.startups.map(o => o.slug)).toEqual(['new', 'mid']);
    eP(p.calls.map(o => o.slug)).toEqual(['soon', 'next']);
    eP(p.events.map(o => o.slug)).toEqual(['a', 'b']);
  });
});
