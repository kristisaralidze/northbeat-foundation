import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { podcastQuery } from '@/lib/podcast.query';
import { durationLabel, episodeLabel, sortEpisodes } from '@/lib/podcast';
import { dateLabel } from '@/lib/events';

export const Route = createFileRoute('/podcast')({
  loader: ({ context }) => context.queryClient.ensureQueryData(podcastQuery),
  head: () => ({
    meta: [
      { title: 'Podcast: Northbeat' },
      { name: 'description', content: 'Conversations with the people building Nordic health startups.' },
      { property: 'og:title', content: 'Podcast: Northbeat' },
      { property: 'og:description', content: 'Conversations with the people building Nordic health startups.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: '/podcast' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [{ rel: 'canonical', href: '/podcast' }],
  }),
  component: Podcast,
  errorComponent: ({ reset }) => { const client = useQueryClient(); return <div className="nb-container nb-section"><h1 className="nb-h2">The podcast couldn’t be loaded</h1><p className="nb-body mt-4 text-danger" role="alert">Please try again in a moment.</p><Button variant="ghost" className="nb-btn nb-btn-primary mt-6" onClick={async () => { await client.resetQueries({ queryKey: ['public-podcast'] }); reset(); }}>Try again</Button></div>; },
  notFoundComponent: () => <div className="nb-container nb-section"><h1 className="nb-h2">Podcast not found</h1></div>,
});

function Podcast() {
  const { data } = useSuspenseQuery(podcastQuery);
  const episodes = sortEpisodes(data.episodes);
  return <div className="nb-container nb-section">
    <header className="mb-8"><h1 className="nb-h1">Podcast</h1>
      <p className="nb-lead mt-4 max-w-2xl">Conversations with the people building Nordic health startups.</p></header>
    <p className="nb-small mb-6 text-muted-foreground" role="status">{episodes.length} {episodes.length === 1 ? 'episode' : 'episodes'}</p>
    {episodes.length > 0 && <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {episodes.map((episode) => {
        const duration = durationLabel(episode.duration_seconds);
        return <li key={episode.id} className="nb-card flex min-w-0 flex-col gap-4">
          <div className="nb-org-logo shrink-0">{episode.cover_url ? <img src={episode.cover_url} alt={`${episode.title} cover`} className="h-full w-full object-cover" /> : <Radio className="h-8 w-8 text-muted-foreground" aria-hidden />}</div>
          <p className="nb-eyebrow">{episodeLabel(episode)}{episode.published_on ? ` · ${dateLabel(episode.published_on)}` : ''}{duration ? ` · ${duration}` : ''}</p>
          <h2 className="nb-h3"><Link to="/podcast/$slug" params={{ slug: episode.slug }} className="nb-org-link break-words">{episode.title}</Link></h2>
          {episode.guests.length > 0 && <p className="nb-small text-muted-foreground">With {episode.guests.map((guest, index) => <span key={guest.id}>{index > 0 && ', '}<Link to="/person/$slug" params={{ slug: guest.slug }} className="nb-link">{guest.name}</Link></span>)}</p>}
          {episode.summary && <p className="nb-small text-muted-foreground break-words">{episode.summary}</p>}
          {episode.topics.length > 0 && <div className="mt-auto flex flex-wrap gap-2">{episode.topics.map((topic) => <span key={topic.id} className="nb-chip">{topic.name}</span>)}</div>}
        </li>;
      })}
    </ul>}
    {episodes.length === 0 && <div className="py-12"><h2 className="nb-h3">No episodes yet</h2><p className="nb-body mt-3 text-muted-foreground">Our first episode is on its way.</p></div>}
  </div>;
}
