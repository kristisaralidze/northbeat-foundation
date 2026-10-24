export type IssueCard = { id: string; slug: string; title: string; summary: string | null; issue_number: number | null; sent_on: string | null };
export type IssueLink = { id: string; kind: string; slug: string; title: string; summary: string | null };
export type IssueDetail = IssueCard & { body: string | null; web_url: string | null; links: IssueLink[] };

export function issueLabel(issue: Pick<IssueCard, 'issue_number'>): string {
  return issue.issue_number != null ? `Issue ${issue.issue_number}` : 'Issue';
}

export function sortIssues<T extends Pick<IssueCard, 'sent_on' | 'issue_number'>>(issues: T[]): T[] {
  return [...issues].sort((a, b) =>
    (Date.parse(b.sent_on ?? '') || 0) - (Date.parse(a.sent_on ?? '') || 0)
    || (b.issue_number ?? 0) - (a.issue_number ?? 0));
}

/** Public route for a linked entry kind; null when the kind has no public page. */
export function entryPath(kind: string): string | null {
  switch (kind) {
    case 'organisation': return '/org';
    case 'person': return '/person';
    case 'event': return '/event';
    case 'opportunity': return '/opportunity';
    case 'episode': return '/podcast';
    default: return null;
  }
}

type PreviewOrg = { slug: string; type: string; published_at?: string | null };
type PreviewDeadline = { slug: string; deadline_at: string | null };
type PreviewEvent = { slug: string; starts_at: string | null; ends_at: string | null };
/** Real items for the "What an issue looks like" card: 2 newest startups, 2 nearest future deadlines, next 2 events. */
export function issuePreview<O extends PreviewOrg, D extends PreviewDeadline, E extends PreviewEvent>(orgs: O[], deadlines: D[], events: E[], now: string) {
  const t = Date.parse(now);
  const startups = orgs.filter(o => o.type === 'startup' && o.published_at).sort((a, b) => Date.parse(b.published_at!) - Date.parse(a.published_at!)).slice(0, 2);
  const calls = deadlines.filter(d => d.deadline_at && Date.parse(d.deadline_at) >= t - 86_400_000 + 1).sort((a, b) => Date.parse(a.deadline_at!) - Date.parse(b.deadline_at!)).slice(0, 2);
  const next = events.filter(e => e.starts_at && Date.parse(e.ends_at ?? e.starts_at) >= t).sort((a, b) => Date.parse(a.starts_at!) - Date.parse(b.starts_at!)).slice(0, 2);
  return { startups, calls, events: next };
}
