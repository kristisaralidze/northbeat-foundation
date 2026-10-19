import { queryOptions } from '@tanstack/react-query';
import { getOpportunities } from './opportunities.functions';
export const opportunitiesQuery = queryOptions({ queryKey: ['public-opportunities'], queryFn: () => getOpportunities(), staleTime: 60_000, refetchInterval: 60_000 });
