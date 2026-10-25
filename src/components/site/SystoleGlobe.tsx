import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import still from '@/assets/nordic-globe-still.jpg';
import type { GlobeGesture, GlobePalette } from './SystoleGlobeScene';

const Scene = lazy(() => import('./SystoleGlobeScene'));
class GlobeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function SystoleGlobe() {
  const host = useRef<HTMLDivElement>(null);
  const gesture = useRef<GlobeGesture>({ yaw: 0, pitch: 0, dragging: false });
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [palette, setPalette] = useState<GlobePalette | null>(null);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const invalidate = () => host.current?.dispatchEvent(new Event('northbeat:globe-drag'));
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const css = getComputedStyle(el), probe = document.createElement('canvas'), ctx = probe.getContext('2d');
    const color = (token: string) => {
      if (!ctx) return '';
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = css.getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    };
    setPalette({ land: color('--systole-globe-land'), sea: color('--systole-globe-sea'), wire: color('--ink'), plum: color('--berry'), nordic: color('--systole-globe-nordic'), light: color('--systole-paper') });
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(query.matches); motion(); query.addEventListener('change', motion);
    let inView = false;
    const sync = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? false; sync(); }, { threshold: .1 });
    observer.observe(el); document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); query.removeEventListener('change', motion); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const fallback = <img src={still} alt="Globe facing Finland, Sweden, Norway, Denmark and Iceland" className="nb-systole-globe-still" />;
  const end = () => { gesture.current.dragging = false; pointer.current = null; };
  return <div ref={host} className="nb-systole-globe" role="group" aria-label="Interactive globe highlighting Finland, Sweden, Norway, Denmark and Iceland" tabIndex={0} data-paused={!active || reduced}
    onPointerDown={e => { if (e.button !== 0) return; pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; gesture.current.dragging = true; if (e.pointerType === 'mouse') e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={e => { const p = pointer.current; if (!p || p.id !== e.pointerId) return; gesture.current.yaw += (e.clientX - p.x) * .006; if (e.pointerType === 'mouse') gesture.current.pitch = Math.max(-.5, Math.min(.5, gesture.current.pitch + (e.clientY - p.y) * .004)); pointer.current = { id: p.id, x: e.clientX, y: e.clientY }; invalidate(); }}
    onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
    onKeyDown={e => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); gesture.current.yaw += e.key === 'ArrowRight' ? .15 : -.15; invalidate(); }}>
    <ClientOnly fallback={fallback}>{palette && !failed ? <GlobeBoundary fallback={fallback}><Suspense fallback={fallback}><Scene palette={palette} gesture={gesture} active={active} reduced={reduced} onFailure={fail} /></Suspense></GlobeBoundary> : fallback}</ClientOnly>
  </div>;
}