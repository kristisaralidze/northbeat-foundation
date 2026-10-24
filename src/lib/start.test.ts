import { describe, expect, it } from 'vitest';
import { openCalls, orgsOfTypes, upcomingEvents, isAudience, ORG_SECTIONS } from './start';
import type { OpportunityRow } from './opportunities';
import type { EventRow } from './events';
import type { DirectoryOrganisation } from './explore';

const now = '2026-10-24T12:00:00Z';
const opp = (id: string, type: string, deadline_at: string | null, description: string | null = null): OpportunityRow => ({ id, slug: id, title: id, type, summary: null, opens_at: null, deadline_at, amount_min_eur: null, amount_max_eur: null, location: null, employment_type: null, remote_ok: null, termIds: [], description });
const ev = (id: string, starts_at: string | null): EventRow => ({ id, slug: id, title: id, event_type: 'meetup', summary: null, starts_at, ends_at: null, apply_deadline_at: null, timezone: null, city: null, venue: null, format: null });

describe('start pages', () => {
  it('only founder, researcher and student exist', () => {
    expect(isAudience('founder')).toBe(true); expect(isAudience('investor')).toBe(false);
  });
  it('funding calls are sorted by nearest deadline and exclude closed ones', () => {
    const rows = [opp('late', 'grant_call', '2027-01-10'), opp('closed', 'grant_call', '2026-10-01'), opp('soon', 'programme_intake', '2026-11-01'), opp('job', 'job', '2026-11-02')];
    expect(openCalls(rows, ['grant_call', 'programme_intake', 'competition'], now).map(o => o.id)).toEqual(['soon', 'late']);
  });
  it('researchers see grant calls only', () => {
    expect(openCalls([opp('a', 'competition', '2026-12-01'), opp('b', 'grant_call', '2026-12-01')], ['grant_call'], now).map(o => o.id)).toEqual(['b']);
  });
  it('events are upcoming only, nearest first', () => {
    expect(upcomingEvents([ev('past', '2026-10-01T10:00:00Z'), ev('b', '2026-12-01T10:00:00Z'), ev('a', '2026-11-01T10:00:00Z'), ev('tba', null)], now).map(e => e.id)).toEqual(['a', 'b']);
  });
  it('founders see incubators and accelerators together', () => {
    const o = (name: string, type: string) => ({ id: name, slug: name, name, type, short_description: null, logo_url: null, website: null, city: null, termIds: [] }) as DirectoryOrganisation;
    expect(orgsOfTypes([o('B', 'accelerator'), o('A', 'incubator'), o('C', 'investor')], ORG_SECTIONS.founder[0]!.types).map(x => x.name)).toEqual(['A', 'B']);
  });
});
