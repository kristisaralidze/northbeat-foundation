import { useEffect, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ecosystemQuery } from '@/lib/ecosystem.query';
import { ECOSYSTEM_GROUPS, layoutNetwork, networkTiming, profileHref, type NetworkNode } from '@/lib/ecosystem';

const SVG_NS = 'http://www.w3.org/2000/svg';
export function EcosystemNetwork() {
  const { data } = useSuspenseQuery(ecosystemQuery);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<NetworkNode | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 600px)');
    const touch = window.matchMedia('(hover: none)');
    let frame = 0, hasEntered = reduced.matches, completed = reduced.matches;
    let activeId: string | null = null;
    const render = () => {
      cancelAnimationFrame(frame); svg.replaceChildren();
      const width = svg.clientWidth, height = svg.clientHeight;
      if (width < 1 || height < 1) return;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const nodes = layoutNetwork(data, width, height);
      const byId = new Map(nodes.map(n => [n.id, n]));
      const element = (tag: string) => document.createElementNS(SVG_NS, tag);
      const paths = data.links.map(e => {
        const path = element('path'); path.setAttribute('class', 'nb-network-edge');
        path.dataset['source'] = e.source; path.dataset['target'] = e.target;
        const title = element('title'); title.textContent = e.relation.replace(/_/g, ' '); path.append(title); svg.append(path); return path;
      });
      const anchors: SVGElement[] = [];
      const boxes: { x: number; y: number; w: number; h: number }[] = [];
      const measureCanvas = document.createElement('canvas').getContext('2d');
      if (measureCanvas) measureCanvas.font = '12px "Schibsted Grotesk"';
      const degree = (id: string) => data.links.filter(e => e.source === id || e.target === id).length;
      const labelIds = new Set([...nodes].sort((a, b) => degree(b.id) - degree(a.id)).slice(0, phone.matches ? 5 : 15).map(n => n.id));
      const highlight = (id: string | null) => {
        activeId = id;
        const connected = new Set<string>(id ? [id] : []);
        data.links.forEach(e => { if (e.source === id) connected.add(e.target); if (e.target === id) connected.add(e.source); });
        anchors.forEach((a, i) => { const n = nodes[i]; if (!n) return; a.setAttribute('data-dimmed', String(Boolean(id && !connected.has(n.id)))); a.setAttribute('data-selected', String(n.id === id)); });
        paths.forEach((p, i) => { const e = data.links[i]; if (!e) return; const on = e.source === id || e.target === id; p.setAttribute('data-active', String(on)); p.setAttribute('data-dimmed', String(Boolean(id && !on))); });
        setSelected(id ? byId.get(id) ?? null : null);
      };
      nodes.forEach(n => {
        const a = element('a'); a.setAttribute('href', profileHref(n)); a.setAttribute('class', `nb-network-node nb-network-group-${n.group}`);
        a.setAttribute('aria-label', `${n.name}, ${n.type}`); a.setAttribute('data-node-id', n.id); a.setAttribute('tabindex', '0');
        const title = element('title'); title.textContent = `${n.name}: ${n.type}`; a.append(title);
        const hit = element('circle'); hit.setAttribute('r', '22'); hit.setAttribute('class', 'nb-network-hit'); a.append(hit);
        const ring = element('circle'); ring.setAttribute('r', '11'); ring.setAttribute('class', 'nb-network-ring'); a.append(ring);
        const dot = element('circle'); dot.setAttribute('r', n.kind === 'organisation' ? '5' : '4'); dot.setAttribute('class', 'nb-network-dot'); a.append(dot);
        if (labelIds.has(n.id)) {
          const x = n.x ?? width / 2, y = n.y ?? height / 2;
          const w = Math.min(width - 24, (measureCanvas?.measureText(n.name).width ?? n.name.length * 7) + 8);
          const left = Math.max(12, Math.min(width - w - 12, x - w / 2));
          const top = y > height - 48 ? y - 28 : y + 13;
          const box = { x: left, y: top, w, h: 18 };
          const overlaps = boxes.some(b => box.x < b.x + b.w + 6 && box.x + box.w + 6 > b.x && box.y < b.y + b.h + 4 && box.y + box.h + 4 > b.y);
          if (!overlaps) {
            boxes.push(box);
            const label = element('text'); label.setAttribute('x', String(left - x + 4)); label.setAttribute('y', String(top - y + 12));
            label.setAttribute('class', 'nb-network-label'); label.textContent = n.name;
            if ((measureCanvas?.measureText(n.name).width ?? 0) > w - 8) { label.setAttribute('textLength', String(w - 8)); label.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
            a.append(label);
          }
        }
        a.addEventListener('pointerenter', e => { if ((e as PointerEvent).pointerType !== 'touch' && !touch.matches) highlight(n.id); });
        a.addEventListener('pointerleave', () => { if (!touch.matches) highlight(null); });
        a.addEventListener('focus', () => highlight(n.id));
        a.addEventListener('blur', () => { if (!touch.matches) highlight(null); });
        a.addEventListener('click', e => { if ((touch.matches || phone.matches) && activeId !== n.id) { e.preventDefault(); highlight(n.id); } });
        a.addEventListener('keydown', e => { const key = (e as KeyboardEvent).key; if (key === 'Escape') highlight(null); });
        svg.append(a); anchors.push(a);
      });
      let start: number | undefined;
      const draw = (now: number) => {
        start ??= now;
        const timing = networkTiming(now - start, reduced.matches || completed, data.links.length);
        const ease = 1 - Math.pow(1 - timing.entry, 3);
        const positions = new Map<string, { x: number; y: number }>();
        nodes.forEach((n, i) => {
          const edge = i % 4, offset = (i * .618033) % 1;
          const sx = edge === 0 ? -width * .3 : edge === 1 ? width * 1.3 : offset * width;
          const sy = edge === 2 ? -height * .3 : edge === 3 ? height * 1.3 : offset * height;
          const x = sx + ((n.x ?? width / 2) - sx) * ease, y = sy + ((n.y ?? height / 2) - sy) * ease;
          positions.set(n.id, { x, y }); anchors[i]?.setAttribute('transform', `translate(${x},${y})`);
        });
        paths.forEach((p, i) => { const e = data.links[i]; if (!e) return; const s = positions.get(e.source), t = positions.get(e.target); if (!s || !t) return;
          const progress = Math.max(0, Math.min(1, timing.connections - i));
          p.setAttribute('d', `M${s.x},${s.y}L${s.x + (t.x - s.x) * progress},${s.y + (t.y - s.y) * progress}`);
        });
        svg.dataset['phase'] = timing.entry < 1 ? 'entering' : timing.connections < data.links.length ? 'connecting' : 'settled';
        if (timing.entry < 1 || timing.connections < data.links.length) frame = requestAnimationFrame(draw); else completed = true;
      };
      if (hasEntered || reduced.matches) draw(performance.now());
      else svg.dataset['phase'] = 'waiting';
      if (activeId) highlight(activeId);
    };
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting) && !hasEntered) { hasEntered = true; render(); observer.disconnect(); } }, { threshold: .15 });
    observer.observe(svg);
    const resize = new ResizeObserver(render); resize.observe(svg);
    const motionChange = () => { if (reduced.matches) { hasEntered = true; completed = true; } render(); };
    reduced.addEventListener('change', motionChange);
    phone.addEventListener('change', render);
    render();
    void document.fonts.ready.then(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); reduced.removeEventListener('change', motionChange); phone.removeEventListener('change', render); };
  }, [data]);
  return <section className="nb-network-section" aria-labelledby="ecosystem-heading">
    <div className="nb-container"><h2 id="ecosystem-heading" className="nb-network-heading">The ecosystem</h2></div>
    <svg ref={svgRef} className="nb-network-figure" role="group" aria-label="Published Nordic health organisations, events and opportunities" />
    <div className="nb-container">
      <div className="nb-network-selection" aria-live="polite">
        {selected && <><a href={profileHref(selected)} className="nb-link">{selected.name}</a><span>{selected.type}</span></>}
      </div>
      <ul className="nb-network-legend" aria-label="Ecosystem groups">{ECOSYSTEM_GROUPS.map((group, i) => <li key={group} className={`nb-network-group-${i}`}><i aria-hidden="true" />{group}</li>)}</ul>
    </div>
  </section>;
}