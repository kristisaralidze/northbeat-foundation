import { useEffect, useRef, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { livingCellsQuery } from '@/lib/ecosystem.query';
import { CELL_GROUPS, CELL_LINKS, cellGroup, cellHref, relationSentence } from '@/lib/living-cells';
import { createCellScene, type CellScene, type CellSelection } from './living-cells-canvas';
import { OrganisationLogo } from './OrganisationLogo';

const sameSelection = (a: CellSelection, b: CellSelection) => a?.group === b?.group && a?.orgId === b?.orgId;
export function LivingCells() {
  const { data } = useSuspenseQuery(livingCellsQuery);
  const canvasRef = useRef<HTMLCanvasElement>(null), sceneRef = useRef<CellScene | null>(null);
  const selectionRef = useRef<CellSelection>(null), drawRef = useRef<(() => void) | null>(null);
  const [selection, setSelection] = useState<CellSelection>(null);
  const select = (value: CellSelection) => {
    if (sameSelection(value, selectionRef.current)) return;
    selectionRef.current = value; setSelection(value); drawRef.current?.();
  };
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scene: CellScene | null = null, visible = false, started = false, raf = 0, previous = 0, time = 0, opening = 0, disposed = false;
    const draw = () => scene?.draw(motion.matches ? 0 : time, motion.matches ? 10 : opening, selectionRef.current);
    const tick = (now: number) => {
      raf = 0; if (disposed || !visible || document.hidden) { previous = 0; return; }
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 0; previous = now; time += dt; opening += dt;
      draw(); if (!motion.matches) raf = requestAnimationFrame(tick);
    };
    const resume = () => { if (visible && !document.hidden && !disposed) { if (motion.matches) draw(); else if (!raf) raf = requestAnimationFrame(tick); } };
    const resize = () => { scene = createCellScene(canvas, data, motion.matches); sceneRef.current = scene; draw(); resume(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) { if (!started) { started = true; opening = 0; } resume(); }
      else { cancelAnimationFrame(raf); raf = 0; previous = 0; }
      canvas.dataset['animating'] = String(visible && !motion.matches);
    }, { threshold: .02 });
    const ro = new ResizeObserver(resize); ro.observe(canvas); observer.observe(canvas);
    const changed = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; resize(); };
    const visibilityChanged = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previous = 0; } else resume(); };
    motion.addEventListener('change', changed); document.addEventListener('visibilitychange', visibilityChanged);
    drawRef.current = draw; resize();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); ro.disconnect(); motion.removeEventListener('change', changed); document.removeEventListener('visibilitychange', visibilityChanged); drawRef.current = null; sceneRef.current = null; };
  }, [data]);
  const names = new Map(data.organisations.map(o => [o.id, o.name]));
  const selectedOrg = selection?.orgId ? data.organisations.find(o => o.id === selection.orgId) : null;
  const group = selection ? CELL_GROUPS[selection.group] : null;
  const sentences = selection ? selectedOrg ? data.relations.filter(r => r.from_org_id === selectedOrg.id || r.to_org_id === selectedOrg.id).map(r => relationSentence(r, selectedOrg.id, names)) : CELL_LINKS.filter(l => l.from === selection.group || l.to === selection.group).map(l => l.sentence) : [];
  const href = selectedOrg ? `/org/${encodeURIComponent(selectedOrg.slug)}` : selection ? cellHref(selection.group) : '';
  const atPointer = (event: React.PointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return sceneRef.current?.hit(event.clientX - rect.left, event.clientY - rect.top) ?? null; };
  return <section className="nb-living-cells nb-container" aria-labelledby="ecosystem-heading">
    <h2 id="ecosystem-heading" className="nb-network-heading">The ecosystem</h2>
    <div className="nb-cells-stage" onPointerLeave={event => { if (event.pointerType === 'mouse') select(null); }}>
      <canvas ref={canvasRef} className="nb-cells-canvas" aria-label={`Nordic health ecosystem, ${data.organisations.length} published organisations`} onPointerMove={event => { if (event.pointerType === 'mouse') select(atPointer(event)); }} onPointerDown={event => {
        const hit = atPointer(event);
        if (!hit) { select(null); return; }
        if (event.pointerType === 'mouse' || sameSelection(hit, selectionRef.current)) {
          const org = hit.orgId ? data.organisations.find(o => o.id === hit.orgId) : null;
          window.location.assign(org ? `/org/${encodeURIComponent(org.slug)}` : cellHref(hit.group));
        } else select(hit);
      }} />
      {selection && group && <aside className="nb-cells-card" aria-live="polite">
        {selectedOrg && <OrganisationLogo name={selectedOrg.name} website={selectedOrg.website} uploaded={selectedOrg.logo_url} choice={selectedOrg.logo_choice} />}
        <a className="nb-cells-card-title" href={href}>{selectedOrg?.name ?? group.name}</a>
        <p>{selectedOrg ? group.name : `${data.organisations.filter(o => cellGroup(o.type) === selection.group).length} organisations`}</p>
        {sentences.length > 0 && <ul>{[...new Set(sentences)].map(sentence => <li key={sentence}>{sentence}</li>)}</ul>}
      </aside>}
      <nav className="nb-cells-access" aria-label="Ecosystem groups and organisations">
        {CELL_GROUPS.map((g, index) => {
          const orgs = data.organisations.filter(o => cellGroup(o.type) === index); if (!orgs.length) return null;
          return <div key={g.name}><a href={cellHref(index)} onFocus={() => select({ group: index })} onBlur={() => select(null)}>{g.name}, {orgs.length} organisations</a>
            {orgs.map(o => <a key={o.id} href={`/org/${encodeURIComponent(o.slug)}`} onFocus={() => select({ group: index, orgId: o.id })} onBlur={() => select(null)}>{o.name}</a>)}</div>;
        })}
      </nav>
    </div>
  </section>;
}