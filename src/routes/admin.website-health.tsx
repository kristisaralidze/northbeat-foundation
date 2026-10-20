import { createFileRoute } from '@tanstack/react-router';
import { WebsiteHealth } from '@/components/admin/WebsiteHealth';
export const Route = createFileRoute('/admin/website-health')({
  head: () => ({ meta: [{ title: 'Website health | Northbeat admin' }, { name: 'description', content: 'Review Northbeat website loading and title checks.' }, { property: 'og:title', content: 'Website health | Northbeat admin' }, { property: 'og:description', content: 'Review Northbeat website loading and title checks.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: WebsiteHealth,
});