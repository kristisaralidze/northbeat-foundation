import { queryOptions } from '@tanstack/react-query';
import { getSearchIndex } from './search.functions';
export const searchIndexQuery = queryOptions({ queryKey: ['public-search-index'], queryFn: () => getSearchIndex(), staleTime: 5 * 60_000 });
