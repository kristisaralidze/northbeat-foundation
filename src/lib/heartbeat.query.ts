import { queryOptions } from '@tanstack/react-query';
import { getHeartbeat } from './heartbeat.functions';
export const heartbeatQuery = queryOptions({ queryKey: ['public-heartbeat'], queryFn: () => getHeartbeat(), staleTime: 300_000 });
