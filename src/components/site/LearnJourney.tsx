import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Measure real beat positions so drawing and reveals stay synchronized on phones too. */
export function LearnJourney({ children }: { children: ReactNode }) {
  const host = useRef<HTMLOListElement>(null);
  const [line, setLine] = useState({ width: 1, height: 1, path: '' });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const vertical = window.matchMedia('(max-width: 767px)').matches;
      const stops = [...el.querySelectorAll<HTMLElement>('.nb-journey-stop')];
      const beats = stops.map(stop => stop.querySelector('.nb-journey-beat')?.getBoundingClientRect());
      const last = beats.at(-1);
      const length = vertical && last ? last.top - box.top + last.height / 2 : box.width;
      setLine({ width: box.width, height: box.height, path: vertical ? `M12 0V${length}` : `M0 12H${box.width}` });
      stops.forEach((stop, i) => {
        const beat = beats[i];
        const position = beat ? vertical ? beat.top - box.top + beat.height / 2 : beat.left - box.left + beat.width / 2 : 0;
        stop.style.setProperty('--pulse-delay', `${Math.max(0, position / Math.max(1, length)) * 1.2}s`);
      });
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <ol ref={host} className="nb-journey-line nb-journey-animated">
    <svg className="nb-journey-track" viewBox={`0 0 ${line.width} ${line.height}`} preserveAspectRatio="none" aria-hidden="true"><path d={line.path} pathLength="1" /></svg>
    {children}
  </ol>;
}