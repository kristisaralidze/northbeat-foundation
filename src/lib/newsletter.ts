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
