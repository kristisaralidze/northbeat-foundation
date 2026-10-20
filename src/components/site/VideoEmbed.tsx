import { useState } from 'react';
import type { OfficialVideo } from '@/lib/video';

/** Loads nothing from the video host until the visitor presses play. */
export function VideoEmbed({ video, title, channel }: { video: OfficialVideo; title: string; channel: string | null }) {
  const [playing, setPlaying] = useState(false);
  const [thumbOk, setThumbOk] = useState(true);
  return <div>
    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
      {playing ? <iframe src={video.embedUrl} title={`${title} video`} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={`Play ${title} video`}>
          {video.thumbnail && thumbOk && <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setThumbOk(false)} className="absolute inset-0 h-full w-full object-cover" />}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md">
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
        </button>}
    </div>
    <p className="nb-small mt-3 text-muted-foreground">{playing ? null : `Plays from ${video.platform === 'youtube' ? 'YouTube' : 'Vimeo'} when you press play. `}{channel && <a href={channel} target="_blank" rel="noopener noreferrer" className="nb-link">Official channel</a>}</p>
  </div>;
}
