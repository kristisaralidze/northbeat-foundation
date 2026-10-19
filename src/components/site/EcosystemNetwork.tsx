import { useEffect, useRef } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ecosystemQuery } from '@/lib/ecosystem.query';
import { ECOSYSTEM_GROUPS, GROUP_CONNECTIONS, groupCounts, groupHref, groupPositions } from '@/lib/ecosystem';
import { networkScrollPhases } from '@/lib/home-story';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SHORT_LABELS = ['Startups', 'Investors', 'Incubators and accelerators', 'Funders and grants', 'Universities and research', 'Labs and validation', 'Hospitals and care', 'Public agencies', 'Patient organisations', 'Communities and events', 'Services'];
export function EcosystemNetwork() {
  const { data } = useSuspenseQuery(ecosystemQuery);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let progress = 1, active: number | null = null;
    let drawFrame: (() => void) | undefined;
    const render = () => {
      svg.replaceChildren();
      const width = svg.clientWidth, height = svg.clientHeight;
      if (!width || !height) return;
      const phone = width < 600, positions = groupPositions(width, height);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const element = (tag: string) => document.createElementNS(SVG_NS, tag);
      const paths = GROUP_CONNECTIONS.map(() => { const path = element('path'); path.setAttribute('class', 'nb-network-edge'); svg.append(path); return path; });
      const anchors: SVGElement[] = [];
      const dots: { el: SVGElement; group: number; dx: number; dy: number }[] = [];
      const highlight = (group: number | null) => {
        active = group;
        const connected = new Set<number>(group === null ? [] : [group]);
        GROUP_CONNECTIONS.forEach(([a, b]) => { if (a === group) connected.add(b); if (b === group) connected.add(a); });
        anchors.forEach((el, i) => { el.dataset['dimmed'] = String(group !== null && !connected.has(i)); el.dataset['selected'] = String(i === group); });
        dots.forEach(dot => { dot.el.dataset['dimmed'] = String(group !== null && !connected.has(dot.group)); });
        paths.forEach((el, i) => { const pair = GROUP_CONNECTIONS[i]; const on = pair?.includes(group ?? -1) ?? false; el.dataset['active'] = String(on); el.dataset['dimmed'] = String(group !== null && !on); });
      };
      groupCounts(data).forEach((count, group) => {
        for (let i = 0; i < count; i++) {
          const angle = i * 2.399963, radius = 17 + Math.sqrt(i) * 5;
          const dot = element('circle'); dot.setAttribute('r', '2'); dot.setAttribute('class', `nb-network-cloud nb-network-group-${group}`); dot.setAttribute('aria-hidden', 'true');
          svg.append(dot); dots.push({ el: dot, group, dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius });
        }
      });
      ECOSYSTEM_GROUPS.forEach((name, group) => {
        const anchor = element('a'); anchor.setAttribute('href', groupHref(group)); anchor.setAttribute('class', `nb-network-node nb-network-group-${group}`); anchor.setAttribute('aria-label', name); anchor.setAttribute('tabindex', '0');
        const hit = element('circle'); hit.setAttribute('r', '26'); hit.setAttribute('class', 'nb-network-hit'); anchor.append(hit);
        const ring = element('circle'); ring.setAttribute('r', '12'); ring.setAttribute('class', 'nb-network-ring'); anchor.append(ring);
        const dot = element('circle'); dot.setAttribute('r', group === 0 ? '8' : '6'); dot.setAttribute('class', 'nb-network-dot'); anchor.append(dot);
        const text = element('text'); text.setAttribute('class', 'nb-network-label'); text.setAttribute('text-anchor', 'middle');
        const label = phone ? SHORT_LABELS[group] ?? name : name;
        const measure = document.createElement('canvas').getContext('2d');
        if (measure) measure.font = `${phone ? 13 : 14}px Schibsted Grotesk`;
        const maxWidth = phone ? width * .42 : width * .22;
        const lines: string[] = [];
        for (const word of label.split(' ')) {
          const last = lines[lines.length - 1];
          if (last && (measure?.measureText(`${last} ${word}`).width ?? 0) <= maxWidth) lines[lines.length - 1] = `${last} ${word}`;
          else lines.push(word);
        }
        lines.forEach((line, i) => { const span = element('tspan'); span.setAttribute('x', '0'); span.setAttribute('y', String(35 + i * 17)); span.textContent = line; text.append(span); });
        anchor.append(text); svg.append(anchor); anchors.push(anchor);
        anchor.addEventListener('pointerenter', e => { if ((e as PointerEvent).pointerType !== 'touch') highlight(group); });
        anchor.addEventListener('pointerleave', e => { if ((e as PointerEvent).pointerType !== 'touch') highlight(null); });
        anchor.addEventListener('focus', () => highlight(group));
        anchor.addEventListener('blur', () => highlight(null));
        anchor.addEventListener('pointerdown', e => { if ((e as PointerEvent).pointerType === 'touch' && active !== group) { anchor.dataset['firstTap'] = 'true'; highlight(group); } });
        anchor.addEventListener('click', e => { if (anchor.dataset['firstTap'] === 'true') { e.preventDefault(); delete anchor.dataset['firstTap']; } });
        anchor.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Escape') highlight(null); });
      });
      drawFrame = () => {
        const timing = networkScrollPhases(progress, paths.length, reduced.matches);
        const ease = 1 - Math.pow(1 - timing.entry, 3);
        const current = positions;
        const fly = (x: number, y: number, i: number) => { const edge = i % 4, f = (i * .618033) % 1; const sx = edge === 0 ? -60 : edge === 1 ? width + 60 : f * width, sy = edge === 2 ? -60 : edge === 3 ? height + 60 : f * height; return { x: sx + (x - sx) * ease, y: sy + (y - sy) * ease }; };
        anchors.forEach((a, i) => { const p = current[i]; if (!p) return; const pos = fly(p.x, p.y, i); a.setAttribute('transform', `translate(${pos.x},${pos.y})`); });
        dots.forEach((dot, i) => { const p = current[dot.group]; if (!p) return; const pos = fly(p.x + dot.dx, p.y + dot.dy, i + 11); dot.el.setAttribute('cx', String(pos.x)); dot.el.setAttribute('cy', String(pos.y)); });
        paths.forEach((path, i) => { const pair = GROUP_CONNECTIONS[i]; if (!pair) return; const a = current[pair[0]], b = current[pair[1]]; if (!a || !b) return; const progress = Math.max(0, Math.min(1, timing.connections - i)); path.setAttribute('d', `M${a.x},${a.y}L${a.x + (b.x - a.x) * progress},${a.y + (b.y - a.y) * progress}`); });
        anchors.forEach(a => { const label = a.querySelector('text'); if (label) label.style.opacity = String(timing.labels); });
        svg.dataset['phase'] = timing.labels >= .999 ? 'settled' : timing.entry < 1 ? 'entering' : timing.connections < paths.length ? 'connecting' : 'labelling';
        svg.dataset['progress'] = String(progress);
      };
      drawFrame();
    };
    const scrollProgress = (event: Event) => { progress = (event as CustomEvent<number>).detail; drawFrame?.(); };
    svg.addEventListener('northbeat:network-progress', scrollProgress);
    const resize = new ResizeObserver(render); resize.observe(svg);
    reduced.addEventListener('change', render); render();
    return () => { svg.removeEventListener('northbeat:network-progress', scrollProgress); resize.disconnect(); reduced.removeEventListener('change', render); };
  }, [data]);
  return <section className="nb-network-section" aria-labelledby="ecosystem-heading"><div className="nb-container"><h2 id="ecosystem-heading" className="nb-network-heading">The ecosystem</h2></div><svg ref={svgRef} className="nb-network-figure" role="group" aria-label="Nordic health ecosystem groups" /></section>;
}