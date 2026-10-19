import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { getPublicProfile } from './profiles.functions';
import type { EntityKey } from './admin/entities';
export const profileQuery = (kind: EntityKey, slug: string) => queryOptions({
  queryKey: ['public-profile', kind, slug], staleTime: 60_000,
  queryFn: async () => { const profile = await getPublicProfile({ data: { kind, slug } }); if (!profile) throw notFound(); return profile; },
});
