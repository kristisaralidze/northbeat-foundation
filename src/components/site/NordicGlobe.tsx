import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import still from '@/assets/nordic-globe-still.jpg';
const Scene = lazy(() => import('./NordicGlobeScene'));
class GlobeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function NordicGlobe() {
  const host = useRef<HTMLDivElement>(null);
  const [failed,setFailed] = useState(false), [visible,setVisible] = useState(false), [reduced,setReduced] = useState(true), [reset,setReset] = useState(0);
  const [palette,setPalette] = useState<{ background: string; land: string; berry: string } | null>(null);
  const [storyProgress, setStoryProgress] = useState(1);
  const [zoomProgress, setZoomProgress] = useState(0);
  const [measurement, setMeasurement] = useState(0);
  const ready = useCallback(() => host.current?.dispatchEvent(new CustomEvent('northbeat:globe-ready', { bubbles: true })), []);
  const fail = useCallback(() => setFailed(true),[]);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const query=window.matchMedia('(prefers-reduced-motion: reduce)'); const motion=() => setReduced(query.matches); motion(); query.addEventListener('change',motion);
    const css=getComputedStyle(el), canvas=document.createElement('canvas'), ctx=canvas.getContext('2d');
    const colour=(token: string) => { if (!ctx) return ''; ctx.clearRect(0,0,1,1); ctx.fillStyle=css.getPropertyValue(token).trim(); ctx.fillRect(0,0,1,1); const p=ctx.getImageData(0,0,1,1).data; return `rgb(${p[0]},${p[1]},${p[2]})`; };
    setPalette({background:colour('--globe-background'),land:colour('--globe-land'),berry:colour('--globe-berry')});
    const probe=document.createElement('canvas'); const context=probe.getContext('webgl2'); if (!context) setFailed(true); else context.getExtension('WEBGL_lose_context')?.loseContext();
    const remeasure = () => { setMeasurement(v => v + 1); setReset(v => v + 1); };
    const settle = () => { setStoryProgress(1); setZoomProgress(1); remeasure(); };
    let inView=false; const sync=()=>setVisible(inView && !document.hidden); const observer=new IntersectionObserver(([entry])=>{const entering=!inView && entry?.isIntersecting; inView=entry?.isIntersecting ?? false; sync(); if (entering) remeasure();},{threshold:.05}); observer.observe(el); document.addEventListener('visibilitychange',sync);
    let resizeFrame = 0;
    const resize = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(remeasure); }); resize.observe(el);
    window.addEventListener('resize', remeasure);
    el.addEventListener('northbeat:globe-settle', settle);
    const progress = (event: Event) => setStoryProgress((event as CustomEvent<number>).detail);
    const zoom = (event: Event) => setZoomProgress((event as CustomEvent<number>).detail);
    el.addEventListener('northbeat:globe-progress', progress);
    el.addEventListener('northbeat:globe-zoom', zoom);
    return () => { el.removeEventListener('northbeat:globe-progress', progress); el.removeEventListener('northbeat:globe-zoom', zoom); el.removeEventListener('northbeat:globe-settle', settle); resize.disconnect(); cancelAnimationFrame(resizeFrame); window.removeEventListener('resize', remeasure); observer.disconnect(); query.removeEventListener('change',motion); document.removeEventListener('visibilitychange',sync); };
  },[]);
  const image=<img className="nb-globe-still" src={still} width={1200} height={1000} alt="Dotted world globe facing the Nordics. Finland, Sweden, Norway, Denmark and Iceland highlighted in berry, with ten Nordic cities marked." />;
  return <section className="nb-globe-section" aria-labelledby="nordic-globe-heading"><div className="nb-container"><h2 id="nordic-globe-heading" className="nb-network-heading">The Nordics</h2></div>
    <div ref={host} className="nb-globe-stage" aria-label="Nordic globe" data-story-progress={storyProgress} data-zoom-progress={zoomProgress} data-paused={!visible || reduced || storyProgress < 1} tabIndex={0}>
      <ClientOnly fallback={image}>{!failed && palette ? <GlobeBoundary fallback={image}><Suspense fallback={image}><Scene visible={visible} reduced={reduced} zoomProgress={zoomProgress} reset={reset} measurement={measurement} storyProgress={storyProgress} palette={palette} onFailure={fail} onReady={ready} /></Suspense></GlobeBoundary> : image}</ClientOnly>
    </div>
    <p className="nb-home-globe-line">Built in the Nordics. Open to the world.</p>
  </section>;
}