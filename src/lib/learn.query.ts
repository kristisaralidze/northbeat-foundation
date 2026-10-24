import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { getGlossary, getGuide, getJourneyStep, getLearnHub } from './learn.functions';
export const learnHubQuery = queryOptions({ queryKey: ['public-learn'], queryFn: () => getLearnHub(), staleTime: 60_000 });
export const glossaryQuery = queryOptions({ queryKey: ['public-glossary'], queryFn: () => getGlossary(), staleTime: 60_000 });
export const guideQuery = (slug: string) => queryOptions({
  queryKey: ['public-guide', slug], staleTime: 60_000,
  queryFn: async () => { const guide = await getGuide({ data: { slug } }); if (!guide) throw notFound(); return guide; },
});
export const journeyStepQuery = (slug: string) => queryOptions({
  queryKey: ['public-journey-step', slug], staleTime: 60_000,
  queryFn: async () => { const step = await getJourneyStep({ data: { slug } }); if (!step) throw notFound(); return step; },
});
