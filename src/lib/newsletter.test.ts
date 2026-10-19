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
