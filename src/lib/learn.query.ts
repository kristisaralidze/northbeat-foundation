import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { getGlossary, getGuide, getLearnHub } from './learn.functions';
export const learnHubQuery = queryOptions({ queryKey: ['public-learn'], queryFn: () => getLearnHub(), staleTime: 60_000 });
export const glossaryQuery = queryOptions({ queryKey: ['public-glossary'], queryFn: () => getGlossary(), staleTime: 60_000 });
export const guideQuery = (slug: string) => queryOptions({
  queryKey: ['public-guide', slug], staleTime: 60_000,
  queryFn: async () => { const guide = await getGuide({ data: { slug } }); if (!guide) throw notFound(); return guide; },
});
