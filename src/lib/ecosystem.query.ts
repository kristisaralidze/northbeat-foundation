import { queryOptions } from '@tanstack/react-query';
import { getEcosystem } from './ecosystem.functions';
export const ecosystemQuery = queryOptions({ queryKey: ['public-ecosystem'], queryFn: () => getEcosystem(), staleTime: 60_000 });
import { getEcosystemGroups } from './ecosystem.functions';
export const ecosystemGroupsQuery = queryOptions({ queryKey: ['public-ecosystem-groups'], queryFn: () => getEcosystemGroups(), staleTime: 60_000 });
import { getLivingCells } from './ecosystem.functions';
export const livingCellsQuery = queryOptions({ queryKey: ['public-living-cells'], queryFn: () => getLivingCells(), staleTime: 60_000, refetchInterval: 60_000, refetchOnWindowFocus: true });
