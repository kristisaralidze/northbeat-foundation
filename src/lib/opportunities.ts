export type OpportunityRow = {
  id: string; slug: string; title: string; type: string; summary: string | null;
  opens_at: string | null; deadline_at: string | null;
  amount_min_eur: number | null; amount_max_eur: number | null;
  location: string | null; employment_type: string | null; remote_ok: boolean | null;
  termIds: string[];
  description?: string | null;
};
export type OpportunityTerm = { id: string; kind: string; name: string; slug: string; parent_id: string | null; sort_order: number };
export type OpportunitiesData = { opportunities: OpportunityRow[]; terms: OpportunityTerm[]; now: string };
export type OpportunityFilters = { type: string; field: string; stage: string; archive: boolean };

export function isClosed(opportunity: OpportunityRow, now: string): boolean {
  return Boolean(opportunity.deadline_at && Date.parse(opportunity.deadline_at) < Date.parse(now));
}

export function filterOpportunities(data: OpportunitiesData, filters: OpportunityFilters): OpportunityRow[] {
  const terms = new Map(data.terms.map((term) => [term.id, term]));
  return data.opportunities
    .filter((opportunity) => {
      if (isClosed(opportunity, data.now) !== filters.archive) return false;
      if (filters.type && opportunity.type !== filters.type) return false;
      const tags = opportunity.termIds.flatMap((id) => { const term = terms.get(id); return term ? [term] : []; });
      if (filters.field && !tags.some((tag) => tag.kind === 'field' && tag.slug === filters.field)) return false;
      if (filters.stage && !tags.some((tag) => tag.kind === 'stage' && tag.slug === filters.stage)) return false;
      return true;
    })
    .sort((a, b) => (Date.parse(a.deadline_at ?? '') || Number.MAX_SAFE_INTEGER) - (Date.parse(b.deadline_at ?? '') || Number.MAX_SAFE_INTEGER));
}

/** Full euro amounts; millions as "€2.5M". */
export function euro(value: number): string {
  if (value >= 1_000_000) return `€${Number((value / 1_000_000).toFixed(2)).toString()}M`;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}
export function amountLabel(opportunity: Pick<OpportunityRow, 'amount_min_eur' | 'amount_max_eur'>): string {
  const { amount_min_eur: min, amount_max_eur: max } = opportunity;
  if (min != null && max != null) return min === max ? euro(min) : `${euro(min)} to ${euro(max)}`;
  if (min != null) return `From ${euro(min)}`;
  if (max != null) return `Up to ${euro(max)}`;
  return '';
}
/** "Today, 24 Oct", "Tomorrow, 25 Oct" or "14 Jan 2027". Never a raw ISO date. */
export function friendlyDate(value: string, now: string, timezone = 'Europe/Helsinki'): string {
  const key = (v: string) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(v));
  const days = Math.round((Date.parse(key(value)) - Date.parse(key(now))) / 86_400_000);
  const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: timezone }).format(new Date(value));
  if (days === 0) return `Today, ${short}`;
  if (days === 1) return `Tomorrow, ${short}`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: timezone }).format(new Date(value));
}
/** Open opportunities split into dated (nearest first), rolling, and undated-not-rolling. */
export function splitOpen(rows: OpportunityRow[]) {
  const dated = rows.filter(r => r.deadline_at).sort((a, b) => Date.parse(a.deadline_at!) - Date.parse(b.deadline_at!));
  const rolling = rows.filter(r => !r.deadline_at && isRolling(r));
  const announced = rows.filter(r => !r.deadline_at && !isRolling(r));
  return { dated, rolling, announced };
}

export function deadlineLabel(opportunity: OpportunityRow, now: string): string {
  if (!opportunity.deadline_at) return isRolling(opportunity) ? 'Open now' : 'Dates to be announced';
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(opportunity.deadline_at));
  const dayOf = (value: string) => Math.floor(Date.parse(value) / 86_400_000);
  const days = dayOf(opportunity.deadline_at) - dayOf(now);
  if (days < 0) return `Closed ${date}`;
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${date}, ${days} days left`;
}
export function isRolling(opportunity: OpportunityRow): boolean {
  const timing = `${opportunity.summary ?? ''} ${opportunity.description ?? ''}`;
  if (/dates? (?:to be announced|not (?:yet )?announced)|deadline (?:to be announced|not (?:yet )?announced)|intake (?:to be announced|not (?:yet )?announced)/i.test(timing)) return false;
  return /\b(?:rolling|continuous|continuously|ongoing call|year.round|any time|anytime|no (?:fixed )?deadline)\b/i.test(timing) || opportunity.type === 'job';
}
