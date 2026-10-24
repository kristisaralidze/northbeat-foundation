import { useEffect, useRef, useState, type CSSProperties } from "react";

const LETTERS = Array.from("NORTHBEAT");
const DOT_LETTER = 1; // the O
const FONT_SIZE = 200;
const TRACKING = 0.06 * FONT_SIZE;
/** Plum heart inside the O's counter: 17% of the font size, centred at 53% of the cap height. */
const HEART_PATH = "M0 7.6C0 7.6-9 1.7-9-4.1-9-6.8-6.9-8.9-4.4-8.9-2.6-8.9-1-7.9 0-6.4 1-7.9 2.6-8.9 4.4-8.9 6.9-8.9 9-6.8 9-4.1 9 1.7 0 7.6 0 7.6Z";
const HEART_SCALE = (FONT_SIZE * 0.17) / 20;

type Metrics = { cap: number; width: number; positions: number[]; widths: number[] };

/**
 * "NORTHBEAT" in Bodoni Moda, one text element per letter, with a plum dot in the O.
 * The writing animation is pure CSS, scoped to the .nb-wordmark-animated class on the
 * home hero section; everywhere else (navbar, after the intro) it renders finished.
 */
export function LaboratoryWordmark({ compact = false }: { compact?: boolean }) {
  const host = useRef<HTMLHeadingElement>(null);
  const [metrics, setMetrics] = useState<Metrics>({ cap: 144, width: 1293, positions: LETTERS.map((_, i) => i * 144), widths: LETTERS.map(() => 141) });

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !host.current) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `400 ${FONT_SIZE}px ${getComputedStyle(host.current).fontFamily}`;
      const cap = ctx.measureText("H").actualBoundingBoxAscent || 144;
      const widths = LETTERS.map((letter) => ctx.measureText(letter).width);
      let x = 0;
      const positions = widths.map((width) => { const start = x; x += width + TRACKING; return start; });
      setMetrics({ cap, width: x - TRACKING, positions, widths });
    });
    return () => { cancelled = true; };
  }, []);

  const Tag = compact ? 'span' : 'h1';
  const dotX = (metrics.positions[DOT_LETTER] ?? 0) + (metrics.widths[DOT_LETTER] ?? 0) / 2;
  const dotY = metrics.cap * 0.53;
  return <Tag ref={host} className="nb-laboratory-wordmark" aria-label="Northbeat">
    <span className="sr-only">Northbeat</span>
    <svg viewBox={`0 0 ${metrics.width} ${metrics.cap}`} className="nb-laboratory-lettering" aria-hidden="true">
      <defs>
        <filter id="nb-wet-ink" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" from="5" to="0" dur="5s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0 0 0.25 1" />
          </feDisplacementMap>
        </filter>
      </defs>
      <g className="nb-wordmark-letters">
        {LETTERS.map((letter, index) => (
          <text key={index} x={metrics.positions[index] ?? 0} y={metrics.cap} style={{ "--i": index } as CSSProperties}>{letter}</text>
        ))}
      </g>
      <g transform={`translate(${dotX} ${dotY}) scale(${HEART_SCALE})`}>
        <g className="nb-wordmark-heart">
          <path className={`nb-wordmark-heart-beat${compact ? ' nb-wordmark-heart-soft' : ''}`} d={HEART_PATH} />
        </g>
      </g>
    </svg>
  </Tag>;
}
