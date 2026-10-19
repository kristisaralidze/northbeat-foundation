import { queryOptions } from '@tanstack/react-query';
import { getDirectory } from './explore.functions';
export const directoryQuery = queryOptions({ queryKey: ['public-organisations'], queryFn: () => getDirectory(), staleTime: 60_000 });