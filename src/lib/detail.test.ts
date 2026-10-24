import { describe, it, expect } from 'vitest';
import { daysUntil, withinSevenDays, nearbyFirst, eventCalendar } from './detail';
describe('detail date and recommendation rules', () => {
  it('counts calendar days in the event timezone', () => { expect(daysUntil('2026-11-18T08:00:00Z', '2026-10-20T06:27:00Z')).toBe(29); expect(daysUntil(null, '2026-10-20')).toBeNull(); });
  it('includes seven days but excludes eight days from same-week recommendations', () => { expect(withinSevenDays('2026-11-25T08:00:00Z', '2026-11-18T08:00:00Z')).toBe(true); expect(withinSevenDays('2026-11-26T08:00:00Z', '2026-11-18T08:00:00Z')).toBe(false); });
  it('caps similar organisations at four and puts the same city first', () => { const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: String(i), city: i === 5 ? 'Helsinki' : 'Turku', countryIds: ['fi'] })); const result = nearbyFirst(rows, 'Helsinki', ['fi']); expect(result).toHaveLength(4); expect(result[0]?.id).toBe('5'); });
  it('exports a valid UTC event range and escapes calendar text', () => { const value = eventCalendar({ id: 'slush', title: 'Slush, 2026', start: '2026-11-18T08:00:00Z', end: '2026-11-19T16:00:00Z', location: 'Helsinki', description: 'Meet; founders', url: 'https://slush.org' }); expect(value).toContain('DTSTART:20261118T080000Z'); expect(value).toContain('DTEND:20261119T160000Z'); expect(value).toContain('SUMMARY:Slush\\, 2026'); });
});import { countdownLabel, withinDays, registrationClosed, closeToThem } from './detail';
describe('action-first detail rules', () => {
  it('labels countdowns', () => {
    expect(countdownLabel('2026-11-18T08:00:00Z', '2026-10-24T08:00:00Z')).toBe('In 25 days');
    expect(countdownLabel('2026-10-24T15:00:00Z', '2026-10-24T08:00:00Z')).toBe('Today');
    // Wed 21 Oct 2026 -> Sat 24 Oct
    expect(countdownLabel('2026-10-24T10:00:00Z', '2026-10-21T08:00:00Z')).toBe('This weekend');
    expect(countdownLabel('2026-10-01T10:00:00Z', '2026-10-21T08:00:00Z')).toBeNull();
  });
  it('same week means 3 days before or after', () => {
    expect(withinDays('2026-11-21T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(true);
    expect(withinDays('2026-11-22T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(false);
    expect(withinDays('2026-11-15T10:00:00Z', '2026-11-18T10:00:00Z')).toBe(true);
  });
  it('closes registration after the deadline, or after the start without one', () => {
    expect(registrationClosed('2026-10-20T00:00:00Z', '2026-11-01T00:00:00Z', '2026-10-24T00:00:00Z')).toBe(true);
    expect(registrationClosed(null, '2026-11-01T00:00:00Z', '2026-10-24T00:00:00Z')).toBe(false);
    expect(registrationClosed(null, null, '2026-10-24T00:00:00Z')).toBe(false);
  });
  it('needs two shared signals or a direct relation, and ranks relations first', () => {
    const rows=[{id:'r',title:'Relation',city:null,fieldIds:[]},{id:'f',title:'Field',city:'Oulu',fieldIds:['med']},{id:'c1',title:'City 1',city:'Oulu',fieldIds:[]},{id:'c2',title:'City 2',city:'Oulu',fieldIds:[]},{id:'t',title:'Type',city:null,type:'investor',fieldIds:[]}];
    const out=closeToThem(rows,{id:'self',slug:'self',city:'Oulu',type:'investor',fieldNames:{med:'Medtech'},relations:{r:'Partner'}});
    expect(out).toHaveLength(2);expect(out.map(o=>o.reason)).toEqual(['Partner','Same field: Medtech']);
  });
  it('hides the section when fewer than two qualify', () => {
    const rows=[{id:'f',title:'Field',city:'Oulu',fieldIds:['med']},{id:'c1',title:'City 1',city:'Oulu',fieldIds:[]}];
    expect(closeToThem(rows,{id:'self',slug:'self',city:'Oulu',type:'investor',fieldNames:{med:'Medtech'},relations:{}})).toHaveLength(0);
  });
  it('never puts universities next to startups without a direct relation', () => {
    const rows=[{id:'u',title:'Uni',city:'Oulu',type:'university',fieldIds:['med']},{id:'s',title:'Startup',city:'Oulu',type:'startup',fieldIds:['med']}];
    const self={id:'self',slug:'self',city:'Oulu',type:'startup',fieldNames:{med:'Medtech'},relations:{}};
    expect(closeToThem(rows,self).map(o=>o.id)).toEqual(['s']);
    expect(closeToThem(rows,{...self,relations:{u:'Partner'}}).map(o=>o.id)).toEqual(['u','s']);
  });
});
import {urgencyLevel,offerChips} from './detail';
describe('value pass rules',()=>{
 it('fills countdowns through day 7',()=>{expect(urgencyLevel(0)).toBe('filled');expect(urgencyLevel(7)).toBe('filled');expect(urgencyLevel(8)).not.toBe('filled');});
 it('outlines days 8 through 14',()=>{expect(urgencyLevel(8)).toBe('outline');expect(urgencyLevel(14)).toBe('outline');expect(urgencyLevel(15)).toBe('plain');});
 it('uses editable offer chips capped at four',()=>{expect(offerChips('incubator',['A','B','C','D','E'])).toEqual(['A','B','C','D']);expect(offerChips('incubator',[])).toEqual(['Workspace','Coaching','Investor intros']);});
});
