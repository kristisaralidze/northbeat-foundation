import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, CanvasTexture, SRGBColorSpace } from 'three';
import points from '@/assets/globe-points.json';
import { clampGlobeDistance, globePosition, GLOBE_ROTATION_SPEED, NORDIC_CITIES } from '@/lib/globe';

type Props = { visible: boolean; reduced: boolean; touched: boolean; wheel: boolean; zoom: number; reset: number; measurement: number; storyProgress: number; palette: { background: string; land: string; berry: string }; onFailure: () => void; onReady: () => void };
function World({ palette }: Pick<Props, 'palette'>) {
  const resources = useMemo(() => {
    const geometry = (rows: number[][]) => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(rows.flatMap(p => globePosition(p[0] ?? 0, p[1] ?? 0, 1.002)), 3)); return g; };
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) { const gradient = ctx.createRadialGradient(32,32,0,32,32,32); gradient.addColorStop(0,palette.berry); gradient.addColorStop(.08,palette.berry); gradient.addColorStop(.45, `${palette.berry.replace('rgb(', 'rgba(').replace(')', ',0.25)')}`); gradient.addColorStop(1,'transparent'); ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64); }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    const diskCanvas = document.createElement('canvas'); diskCanvas.width = diskCanvas.height = 32;
    const disk = diskCanvas.getContext('2d');
    if (disk) { disk.fillStyle = palette.background; disk.beginPath(); disk.arc(16,16,14,0,Math.PI*2); disk.fill(); }
    const diskTexture = new CanvasTexture(diskCanvas);
    return { land: geometry(points.filter(p => p[2] === 0)), nordic: geometry(points.filter(p => p[2] === 1)), texture, diskTexture };
  }, [palette]);
  useEffect(() => () => { resources.land.dispose(); resources.nordic.dispose(); resources.texture.dispose(); resources.diskTexture.dispose(); }, [resources]);
  return <>
    <mesh><sphereGeometry args={[1,48,32]} /><meshBasicMaterial colorWrite={false} /></mesh>
    <points geometry={resources.land}><pointsMaterial color={palette.land} alphaMap={resources.diskTexture} alphaTest={.5} size={.009} sizeAttenuation /></points>
    <points geometry={resources.nordic}><pointsMaterial color={palette.berry} alphaMap={resources.diskTexture} alphaTest={.5} size={.015} sizeAttenuation /></points>
    {NORDIC_CITIES.map(city => <sprite key={city.name} position={globePosition(city.lat,city.lng,1.01)} scale={[.022,.022,1]}><spriteMaterial map={resources.texture} transparent opacity={.8} depthWrite={false} /></sprite>)}
  </>;
}
function Interaction({ visible, reduced, touched, wheel, zoom, reset, measurement, storyProgress, onFailure, onReady }: Props) {
  const { camera, gl, invalidate, setSize } = useThree();
  const previousZoom = useRef(zoom);
  useEffect(() => {
    const host = gl.domElement.closest<HTMLElement>('.nb-globe-stage');
    if (!host || host.clientWidth <= 0 || host.clientHeight <= 0) return;
    setSize(host.clientWidth, host.clientHeight);
    camera.updateProjectionMatrix();
    invalidate();
  }, [measurement, camera, gl, setSize, invalidate]);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => {
    const change = (factor: number) => { camera.position.setLength(clampGlobeDistance(camera.position.length() * factor)); camera.updateProjectionMatrix(); invalidate(); };
    const el = gl.domElement, pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const onWheel = (e: WheelEvent) => { if (!wheel) return; e.preventDefault(); e.stopImmediatePropagation(); const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1); change(Math.exp(dy * .0015)); };
    const down = (e: PointerEvent) => { pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); pinch = 0; };
    const move = (e: PointerEvent) => { if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); const values = [...pointers.values()]; const a=values[0], b=values[1]; if (!a || !b) return; const distance=Math.hypot(a.x-b.x,a.y-b.y); if (pinch > 0 && distance > 0) change(pinch / distance); pinch=distance; };
    const up = (e: PointerEvent) => { pointers.delete(e.pointerId); pinch=0; };
    const lost = (e: Event) => { e.preventDefault(); onFailure(); };
    el.addEventListener('wheel',onWheel,{passive:false,capture:true}); el.addEventListener('pointerdown',down); el.addEventListener('pointermove',move); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('webglcontextlost',lost);
    return () => { el.removeEventListener('wheel',onWheel,true); el.removeEventListener('pointerdown',down); el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); el.removeEventListener('webglcontextlost',lost); };
  }, [camera,gl,invalidate,wheel,onFailure]);
  useEffect(() => { camera.position.setLength(clampGlobeDistance(camera.position.length() * Math.exp((zoom - previousZoom.current) * -.18))); previousZoom.current=zoom; invalidate(); }, [zoom,camera,invalidate]);
  useEffect(() => { camera.position.set(...globePosition(60,14,3.3)); camera.lookAt(0,0,0); invalidate(); }, [reset,camera,invalidate]);
  useEffect(() => { if (reduced) return; camera.position.set(...globePosition(20 + storyProgress * 40, -100 + storyProgress * 114, 3.3)); camera.lookAt(0,0,0); invalidate(); }, [storyProgress,reduced,camera,invalidate]);
  return <OrbitControls enabled={storyProgress >= 1} enablePan={false} enableZoom={false} enableDamping={false} autoRotate={visible && !reduced && !touched && storyProgress >= 1} autoRotateSpeed={GLOBE_ROTATION_SPEED} rotateSpeed={.5} />;
}
export default function NordicGlobeScene(props: Props) {
  return <Canvas flat resize={{ offsetSize: true }} dpr={[1,1.5]} frameloop={props.visible && !props.reduced && !props.touched ? 'always' : 'demand'} camera={{ position: globePosition(60,14,3.3), fov: 42, near: .05, far: 20 }} gl={{ antialias: true, alpha: true }}><World palette={props.palette} /><Interaction {...props} /></Canvas>;
}