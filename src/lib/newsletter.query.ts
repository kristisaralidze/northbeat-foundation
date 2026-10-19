import { queryOptions } from '@tanstack/react-query';
import { getNewsletterIssue, getNewsletterIssues } from './newsletter-issues.functions';
export const issuesQuery = queryOptions({ queryKey: ['public-newsletter-issues'], queryFn: () => getNewsletterIssues(), staleTime: 60_000 });
export const issueQuery = (slug: string) => queryOptions({ queryKey: ['public-newsletter-issue', slug], queryFn: () => getNewsletterIssue({ data: slug }), staleTime: 60_000 });
