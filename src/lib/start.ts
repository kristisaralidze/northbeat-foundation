import type { DirectoryOrganisation } from './explore';
import type { EventRow } from './events';
import { isPast } from './events';
import type { OpportunityRow } from './opportunities';
import { isClosed, isRolling } from './opportunities';

export const AUDIENCES = ['founder', 'researcher', 'student'] as const;
export type Audience = typeof AUDIENCES[number];
export const isAudience = (v: string): v is Audience => (AUDIENCES as readonly string[]).includes(v);

export const AUDIENCE_COPY: Record<Audience, { title: string; lead: string }> = {
  founder: { title: "I'm building a startup", lead: 'Funding calls by deadline, incubators and accelerators, investors and events.' },
  researcher: { title: "I'm a researcher", lead: 'Research grants, universities and research groups, innovation services and events.' },
  student: { title: "I'm a student or clinician", lead: 'The Learn journey, communities and events.' },
};

/** Organisation types shown in each audience's sections, in order. */
export const ORG_SECTIONS: Record<Audience, { heading: string; types: string[] }[]> = {
  founder: [{ heading: 'Incubators and accelerators', types: ['incubator', 'accelerator'] }, { heading: 'Investors', types: ['investor'] }],
  researcher: [{ heading: 'Universities and research groups', types: ['university', 'research_group', 'lab'] }, { heading: 'Innovation services', types: ['service_provider', 'hospital_innovation_unit'] }],
  student: [{ heading: 'Communities', types: ['community'] }],
};
/** Opportunity types counted as funding calls for founders and research grants for researchers. */
export const CALL_TYPES: Record<Audience, string[]> = { founder: ['grant_call', 'programme_intake', 'competition'], researcher: ['grant_call'], student: [] };

export function orgsOfTypes(orgs: DirectoryOrganisation[], types: string[]) {
  return orgs.filter(o => types.includes(o.type)).sort((a, b) => a.name.localeCompare(b.name));
}
/** Open calls of the given types: dated ones first by nearest deadline, then rolling ones. */
export function openCalls(rows: OpportunityRow[], types: string[], now: string) {
  const open = rows.filter(o => types.includes(o.type) && !isClosed(o, now) && (o.deadline_at || isRolling(o)));
  const dated = open.filter(o => o.deadline_at).sort((a, b) => Date.parse(a.deadline_at!) - Date.parse(b.deadline_at!));
  return [...dated, ...open.filter(o => !o.deadline_at)];
}
export function upcomingEvents(events: EventRow[], now: string) {
  return events.filter(e => e.starts_at && !isPast(e, now)).sort((a, b) => Date.parse(a.starts_at!) - Date.parse(b.starts_at!));
}
