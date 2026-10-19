import { useEffect, useRef, useState } from "react";
import petri from "@/assets/wordmark-petri.png.asset.json";
import syringe from "@/assets/wordmark-syringe.png.asset.json";
import flask from "@/assets/wordmark-flask.png.asset.json";

const LETTERS = Array.from("NORTHBEAT");
const OBJECTS = [
  { index: 1, name: "Petri dish", src: petri.url, ratio: 896 / 910 },
  { index: 3, name: "Syringe", src: syringe.url, ratio: 254 / 1091 },
  { index: 7, name: "Conical flask", src: flask.url, ratio: 578 / 891 },
];
type Metrics = { cap: number; width: number; positions: number[]; widths: number[] };

/** Serif letters remain visible until each object has successfully loaded. */
export function LaboratoryWordmark({ compact = false }: { compact?: boolean }) {
  const host = useRef<HTMLHeadingElement>(null);
  const [loaded, setLoaded] = useState<number[]>([]);
  const [phone, setPhone] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ cap: 144, width: 1293, positions: LETTERS.map((_, i) => i * 144), widths: LETTERS.map(() => 141) });

  useEffect(() => {
    let cancelled = false;
    const images = OBJECTS.map((object) => {
      const image = new Image();
      image.onload = () => {
        if (!cancelled) setLoaded((current) => current.includes(object.index) ? current : [...current, object.index]);
      };
      image.src = object.src;
      return image;
    });
    return () => {
      cancelled = true;
      images.forEach((image) => { image.onload = null; });
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 599px)');
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled || !host.current) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = `300 200px ${getComputedStyle(host.current).fontFamily}`;
      const cap = ctx.measureText("H").actualBoundingBoxAscent || 144;
      const widths = LETTERS.map((letter, index) => {
        const object = OBJECTS.find((item) => item.index === index && loaded.includes(index) && !(phone && index === 3));
        const letterWidth = ctx.measureText(letter).width;
        return object ? Math.max(cap * object.ratio, letterWidth * (index === 3 ? 0.62 : 1)) : letterWidth;
      });
      let x = 0;
      const positions = widths.map((width) => { const start = x; x += width + 3; return start; });
      setMetrics({ cap, width: x - 3, positions, widths });
    });
    return () => { cancelled = true; };
  }, [loaded, phone]);

  const Tag = compact ? 'span' : 'h1';
  return <Tag ref={host} className="nb-laboratory-wordmark" aria-label="Northbeat">
    <span className="sr-only">Northbeat</span>
    <svg viewBox={`0 0 ${metrics.width} ${metrics.cap}`} className="nb-laboratory-lettering" aria-hidden="true">
      {LETTERS.map((letter, index) => {
        const object = OBJECTS.find((item) => item.index === index && loaded.includes(index) && !(phone && index === 3));
        const x = metrics.positions[index] ?? 0;
        const width = metrics.widths[index] ?? 0;
        if (!object) return <text key={index} x={x} y={metrics.cap}>{letter}</text>;
        const imageWidth = metrics.cap * object.ratio;
        return <foreignObject key={index} x={x + (width - imageWidth) / 2} y={0} width={imageWidth} height={metrics.cap}><img src={object.src} alt="" className="h-full w-full object-contain" onError={() => setLoaded((current) => current.filter((item) => item !== index))} /></foreignObject>;
      })}
    </svg>
  </Tag>;
}