import { queryOptions } from '@tanstack/react-query';
import { getEcosystem } from './ecosystem.functions';
export const ecosystemQuery = queryOptions({ queryKey: ['public-ecosystem'], queryFn: () => getEcosystem(), staleTime: 60_000 });