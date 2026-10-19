export type EpisodeGuest = { id: string; slug: string; name: string };
export type EpisodeTopic = { id: string; name: string };
export type EpisodeCard = {
  id: string; slug: string; title: string; summary: string | null;
  episode_number: number | null; season: number | null;
  published_on: string | null; cover_url: string | null; embed_url: string | null;
  duration_seconds: number | null;
  guests: EpisodeGuest[]; topics: EpisodeTopic[];
};
export type PodcastData = { episodes: EpisodeCard[] };

export function episodeLabel(episode: Pick<EpisodeCard, 'episode_number' | 'season'>): string {
  if (episode.episode_number == null) return 'Episode';
  return episode.season != null ? `S${episode.season} · E${episode.episode_number}` : `Episode ${episode.episode_number}`;
}

export function durationLabel(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function sortEpisodes(episodes: EpisodeCard[]): EpisodeCard[] {
  return [...episodes].sort((a, b) =>
    (Date.parse(b.published_on ?? '') || 0) - (Date.parse(a.published_on ?? '') || 0)
    || (b.episode_number ?? 0) - (a.episode_number ?? 0));
}
