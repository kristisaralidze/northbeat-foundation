import { queryOptions } from '@tanstack/react-query';
import { getEcosystem } from './ecosystem.functions';
export const ecosystemQuery = queryOptions({ queryKey: ['public-ecosystem'], queryFn: () => getEcosystem(), staleTime: 60_000 });
import { getEcosystemGroups } from './ecosystem.functions';
export const ecosystemGroupsQuery = queryOptions({ queryKey: ['public-ecosystem-groups'], queryFn: () => getEcosystemGroups(), staleTime: 60_000 });
