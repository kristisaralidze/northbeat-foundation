import { queryOptions } from '@tanstack/react-query';
import { getPodcast } from './podcast.functions';
export const podcastQuery = queryOptions({ queryKey: ['public-podcast'], queryFn: () => getPodcast(), staleTime: 60_000 });
