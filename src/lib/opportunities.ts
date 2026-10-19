export type OpportunityRow = {
  id: string; slug: string; title: string; type: string; summary: string | null;
  opens_at: string | null; deadline_at: string | null;
  amount_min_eur: number | null; amount_max_eur: number | null;
  location: string | null; employment_type: string | null; remote_ok: boolean | null;
  termIds: string[];
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

export function amountLabel(opportunity: OpportunityRow): string {
  const { amount_min_eur: min, amount_max_eur: max } = opportunity;
  const format = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  if (min != null && max != null) return min === max ? format(min) : `${format(min)}–${format(max)}`;
  if (min != null) return `From ${format(min)}`;
  if (max != null) return `Up to ${format(max)}`;
  return '';
}

export function deadlineLabel(opportunity: OpportunityRow, now: string): string {
  if (!opportunity.deadline_at) return 'No deadline';
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(opportunity.deadline_at));
  const days = Math.ceil((Date.parse(opportunity.deadline_at) - Date.parse(now)) / 86_400_000);
  if (days < 0) return `Closed ${date}`;
  if (days === 0) return 'Closes today';
  if (days === 1) return 'Closes tomorrow';
  return `${date} · ${days} days left`;
}
