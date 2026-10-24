import { queryOptions } from '@tanstack/react-query';
import { getSiteInfo } from './site.functions';
export const siteInfoQuery = queryOptions({ queryKey: ['public-site-info'], queryFn: () => getSiteInfo(), staleTime: 5 * 60_000 });
