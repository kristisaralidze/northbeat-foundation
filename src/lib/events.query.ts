import { queryOptions } from '@tanstack/react-query';
import { getEvents } from './events.functions';
export const eventsQuery = queryOptions({ queryKey: ['public-events'], queryFn: () => getEvents(), staleTime: 60_000, refetchInterval: 60_000 });
