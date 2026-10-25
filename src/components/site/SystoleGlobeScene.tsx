import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, Group, PointsMaterial } from 'three';
import samples from '@/assets/globe-points.json';
import { globePosition, NORDIC_CITIES } from '@/lib/globe';

export type GlobePalette = { land: string; sea: string; wire: string; plum: string; light: string };
export type GlobeGesture = { yaw: number; pitch: number; dragging: boolean };
type Props = { palette: GlobePalette; active: boolean; reduced: boolean; gesture: MutableRefObject<GlobeGesture>; onFailure: () => void };

function World({ palette, active, reduced, gesture, onFailure }: Props) {
  const group = useRef<Group>(null);
  const highlight = useRef<PointsMaterial>(null);
  const { gl, invalidate } = useThree();
  const time = useRef(0);
  const geometry = useMemo(() => {
    const land: number[] = [], nordic: number[] = [];
    samples.forEach(([lat = 0, lng = 0, region]) => (region === 1 ? nordic : land).push(...globePosition(lat, lng, 1.012)));
    const create = (positions: number[]) => new BufferGeometry().setAttribute('position', new Float32BufferAttribute(positions, 3));
    const lines: number[] = [];
    for (let lat = -60; lat <= 60; lat += 30) for (let lng = -180; lng < 180; lng += 3) lines.push(...globePosition(lat, lng, 1.006), ...globePosition(lat, lng + 3, 1.006));
    for (let lng = -180; lng < 180; lng += 30) for (let lat = -90; lat < 90; lat += 3) lines.push(...globePosition(lat, lng, 1.006), ...globePosition(lat + 3, lng, 1.006));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) { ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill(); }
    return { land: create(land), nordic: create(nordic), lines: create(lines), disk: new CanvasTexture(canvas) };
  }, []);
  useEffect(() => () => { geometry.land.dispose(); geometry.nordic.dispose(); geometry.lines.dispose(); geometry.disk.dispose(); }, [geometry]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => { e.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost', lost);
    const host = canvas.closest<HTMLElement>('.nb-systole-globe');
    const update = () => invalidate();
    host?.addEventListener('northbeat:globe-drag', update);
    return () => { canvas.removeEventListener('webglcontextlost', lost); host?.removeEventListener('northbeat:globe-drag', update); };
  }, [gl, invalidate, onFailure]);
  useFrame((_, rawDelta) => {
    if (!group.current) return;
    const dt = Math.min(rawDelta, .05);
    if (active && !reduced && !gesture.current.dragging) gesture.current.yaw += dt * .035;
    const damping = reduced ? 1 : 1 - Math.exp(-8 * dt);
    group.current.rotation.y += (gesture.current.yaw - group.current.rotation.y) * damping;
    group.current.rotation.x += (gesture.current.pitch - group.current.rotation.x) * damping;
    if (active && !reduced) time.current += dt;
    if (highlight.current) highlight.current.opacity = reduced ? 1 : .88 + .12 * Math.sin(time.current * 1.4);
    const host = gl.domElement.closest<HTMLElement>('.nb-systole-globe');
    if (host) { host.dataset['rotation'] = group.current.rotation.y.toFixed(4); host.dataset['drawCalls'] = String(gl.info.render.calls); host.dataset['triangles'] = String(gl.info.render.triangles); }
  });
  return <>
    <ambientLight intensity={1.8} color={palette.light} />
    <directionalLight position={[0, 4, 3]} intensity={1.2} color={palette.light} />
    <group ref={group}>
      <mesh><sphereGeometry args={[1, 64, 48]} /><meshStandardMaterial color={palette.sea} emissive={palette.sea} emissiveIntensity={.25} roughness={1} metalness={0} toneMapped={false} /></mesh>
      <lineSegments geometry={geometry.lines}><lineBasicMaterial color={palette.plum} transparent opacity={.12} /></lineSegments>
      <points geometry={geometry.land}><pointsMaterial color={palette.land} alphaMap={geometry.disk} alphaTest={.4} size={.014} sizeAttenuation toneMapped={false} /></points>
      <points geometry={geometry.nordic}><pointsMaterial ref={highlight} color={palette.plum} alphaMap={geometry.disk} alphaTest={.4} transparent size={.027} sizeAttenuation toneMapped={false} /></points>
      {NORDIC_CITIES.filter(city => ['Helsinki', 'Stockholm', 'Oslo', 'Copenhagen', 'Reykjavik'].includes(city.name)).map(city => <mesh key={city.name} position={globePosition(city.lat, city.lng, 1.022)}>
        <octahedronGeometry args={[.012, 0]} /><meshStandardMaterial color={palette.plum} emissive={palette.plum} emissiveIntensity={.6} roughness={.45} />
      </mesh>)}
    </group>
  </>;
}

export default function SystoleGlobeScene(props: Props) {
  return <Canvas dpr={[1, 2]} frameloop={props.active && !props.reduced ? 'always' : 'demand'} camera={{ position: globePosition(54, 8, 3.25), fov: 38, near: .1, far: 10 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}><World {...props} /></Canvas>;
}