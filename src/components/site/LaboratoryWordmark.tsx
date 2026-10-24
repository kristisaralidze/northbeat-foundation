import { useEffect, useRef, useState, type CSSProperties } from "react";

const LETTERS = Array.from("NORTHBEAT");
const DOT_LETTER = 3; // the O
const FONT_SIZE = 200;
const TRACKING = 0.06 * FONT_SIZE;

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
  const dotY = metrics.cap * 0.52;
  return <Tag ref={host} className="nb-laboratory-wordmark" aria-label="Northbeat">
    <span className="sr-only">Northbeat</span>
    <svg viewBox={`0 0 ${metrics.width} ${metrics.cap}`} className="nb-laboratory-lettering" aria-hidden="true">
      <defs>
        <filter id="nb-wet-ink" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G">
            <animate attributeName="scale" from="5" to="0" dur="3.4s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0 0 0.25 1" />
          </feDisplacementMap>
        </filter>
      </defs>
      <g className="nb-wordmark-letters">
        {LETTERS.map((letter, index) => (
          <text key={index} x={metrics.positions[index] ?? 0} y={metrics.cap} style={{ "--i": index } as CSSProperties}>{letter}</text>
        ))}
      </g>
      <circle className="nb-wordmark-dot" cx={dotX} cy={dotY} r={FONT_SIZE * 0.035} />
    </svg>
  </Tag>;
}
