import { createFileRoute } from '@tanstack/react-router';
import { CoverReview } from '@/components/admin/CoverReview';
export const Route = createFileRoute('/admin/cover-images')({
  head: () => ({ meta: [{ title: 'Cover image review | Northbeat admin' }, { name: 'description', content: 'Review and approve Northbeat cover images.' }, { property: 'og:title', content: 'Cover image review | Northbeat admin' }, { property: 'og:description', content: 'Review and approve Northbeat cover images.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: CoverReview,
});