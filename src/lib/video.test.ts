import { describe, expect, it } from 'vitest';
import { officialVideo, parseVideo } from './video';

describe('official videos', () => {
  it('embeds YouTube through youtube-nocookie', () => {
    expect(officialVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/@slush')?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
  });
  it('accepts Vimeo with a Vimeo channel', () => {
    expect(officialVideo('https://vimeo.com/123456789', 'https://vimeo.com/curifylabs')?.id).toBe('123456789');
  });
  it('rejects other hosts', () => { expect(parseVideo('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull(); });
  it('rejects a video without an official channel', () => { expect(officialVideo('https://youtu.be/dQw4w9WgXcQ', null)).toBeNull(); });
  it('rejects a channel on another platform', () => { expect(officialVideo('https://youtu.be/dQw4w9WgXcQ', 'https://vimeo.com/slush')).toBeNull(); });
});
