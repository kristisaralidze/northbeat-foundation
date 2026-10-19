import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import still from '@/assets/nordic-globe-still.jpg';
const Scene = lazy(() => import('./NordicGlobeScene'));
class GlobeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function NordicGlobe() {
  const host = useRef<HTMLDivElement>(null);
  const [failed,setFailed] = useState(false), [visible,setVisible] = useState(false), [reduced,setReduced] = useState(true), [touched,setTouched] = useState(false), [wheel,setWheel] = useState(false), [zoom,setZoom] = useState(0), [reset,setReset] = useState(0);
  const [palette,setPalette] = useState<{ background: string; land: string; berry: string } | null>(null);
  const [storyProgress, setStoryProgress] = useState(1);
  const fail = useCallback(() => setFailed(true),[]);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const query=window.matchMedia('(prefers-reduced-motion: reduce)'); const motion=() => setReduced(query.matches); motion(); query.addEventListener('change',motion);
    const css=getComputedStyle(el), canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
    const colour=(token: string) => { if (!ctx) return ''; ctx.clearRect(0,0,1,1); ctx.fillStyle=css.getPropertyValue(token).trim(); ctx.fillRect(0,0,1,1); const p=ctx.getImageData(0,0,1,1).data; return `rgb(${p[0]},${p[1]},${p[2]})`; };
    setPalette({background:colour('--globe-background'),land:colour('--globe-land'),berry:colour('--globe-berry')});
    const probe=document.createElement('canvas'); const context=probe.getContext('webgl2'); if (!context) setFailed(true); else context.getExtension('WEBGL_lose_context')?.loseContext();
    let inView=false; const sync=()=>setVisible(inView && !document.hidden); const observer=new IntersectionObserver(([entry])=>{inView=entry?.isIntersecting ?? false; sync(); if (!inView) setWheel(false);},{threshold:.05}); observer.observe(el); document.addEventListener('visibilitychange',sync);
    const progress = (event: Event) => { const value = (event as CustomEvent<number>).detail; setStoryProgress(value); if (value < 1) { setTouched(false); setWheel(false); } };
    el.addEventListener('northbeat:globe-progress', progress);
    return () => { el.removeEventListener('northbeat:globe-progress', progress); observer.disconnect(); query.removeEventListener('change',motion); document.removeEventListener('visibilitychange',sync); };
  },[]);
  const image=<img className="nb-globe-still" src={still} width={1200} height={1000} alt="Dotted world globe facing the Nordics. Finland, Sweden, Norway, Denmark and Iceland highlighted in berry, with ten Nordic cities marked." />;
  return <section className="nb-globe-section" aria-labelledby="nordic-globe-heading"><div className="nb-container"><h2 id="nordic-globe-heading" className="nb-network-heading">The Nordics</h2></div>
    <div ref={host} className="nb-globe-stage" aria-label="Nordic globe" data-story-progress={storyProgress} data-wheel-active={wheel} data-paused={!visible || touched || reduced || storyProgress < 1} onPointerDown={() => { if (storyProgress >= 1) setTouched(true); }} onClick={() => { if (storyProgress >= 1) setWheel(true); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setWheel(false); }} onKeyDown={e => { if (e.key==='Escape') setWheel(false); }} tabIndex={0}>
      <ClientOnly fallback={image}>{!failed && palette ? <GlobeBoundary fallback={image}><Suspense fallback={image}><Scene visible={visible} reduced={reduced} touched={touched} wheel={wheel} zoom={zoom} reset={reset} storyProgress={storyProgress} palette={palette} onFailure={fail} /></Suspense></GlobeBoundary> : image}</ClientOnly>
    </div>
    {!failed && <div className="nb-globe-controls">
      <Button variant="ghost" size="icon" title="Zoom in" aria-label="Zoom in" onClick={()=>{setTouched(true);setZoom(v=>v+1);}}><Plus /></Button>
      <Button variant="ghost" size="icon" title="Zoom out" aria-label="Zoom out" onClick={()=>{setTouched(true);setZoom(v=>v-1);}}><Minus /></Button>
      <Button variant="ghost" size="icon" title="Return to the Nordics" aria-label="Return to the Nordics" onClick={()=>{setReset(v=>v+1);setTouched(false);setWheel(false);}}><RotateCcw /></Button>
    </div>}
    <p className="nb-home-globe-line">Built in the Nordics. Open to the world.</p>
  </section>;
}