import { describe, expect, it } from 'vitest';
import { durationLabel, episodeLabel, sortEpisodes, type EpisodeCard } from './podcast';

function ep(partial: Partial<EpisodeCard>): EpisodeCard {
  return { id: 'x', slug: 'x', title: 'X', summary: null, episode_number: null, season: null, published_on: null, cover_url: null, embed_url: null, duration_seconds: null, guests: [], topics: [], ...partial };
}

describe('episodeLabel', () => {
  it('labels episodes with and without a season', () => {
    expect(episodeLabel(ep({ episode_number: 3, season: 2 }))).toBe('S2 · E3');
    expect(episodeLabel(ep({ episode_number: 7 }))).toBe('Episode 7');
    expect(episodeLabel(ep({}))).toBe('Episode');
  });
});

describe('durationLabel', () => {
  it('formats minutes and hours', () => {
    expect(durationLabel(1800)).toBe('30 min');
    expect(durationLabel(5400)).toBe('1 h 30 min');
    expect(durationLabel(7200)).toBe('2 h');
    expect(durationLabel(null)).toBe('');
  });
});

describe('sortEpisodes', () => {
  it('orders newest first, falling back to episode number', () => {
    const older = ep({ id: 'a', published_on: '2026-01-10', episode_number: 1 });
    const newer = ep({ id: 'b', published_on: '2026-03-01', episode_number: 2 });
    const undatedHigh = ep({ id: 'c', episode_number: 9 });
    const undatedLow = ep({ id: 'd', episode_number: 4 });
    expect(sortEpisodes([older, undatedLow, newer, undatedHigh]).map((e) => e.id)).toEqual(['b', 'a', 'c', 'd']);
  });
});
