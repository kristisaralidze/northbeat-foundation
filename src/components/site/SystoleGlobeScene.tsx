import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group, PointsMaterial } from 'three';
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
    return { land: create(land), nordic: create(nordic) };
  }, []);
  useEffect(() => () => { geometry.land.dispose(); geometry.nordic.dispose(); }, [geometry]);
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
    if (highlight.current) highlight.current.size = reduced ? .025 : .025 + .003 * Math.sin(time.current * 1.4);
    const host = gl.domElement.closest<HTMLElement>('.nb-systole-globe');
    if (host) { host.dataset['rotation'] = group.current.rotation.y.toFixed(4); host.dataset['drawCalls'] = String(gl.info.render.calls); host.dataset['triangles'] = String(gl.info.render.triangles); }
  });
  return <>
    <ambientLight intensity={1.1} color={palette.light} />
    <directionalLight position={[0, 4, 3]} intensity={2.2} color={palette.light} />
    <group ref={group}>
      <mesh><sphereGeometry args={[1, 48, 32]} /><meshStandardMaterial color={palette.sea} roughness={1} metalness={0} /></mesh>
      <mesh><sphereGeometry args={[1.004, 24, 12]} /><meshBasicMaterial color={palette.wire} wireframe transparent opacity={.07} /></mesh>
      <points geometry={geometry.land}><pointsMaterial color={palette.land} size={.009} sizeAttenuation /></points>
      <points geometry={geometry.nordic}><pointsMaterial ref={highlight} color={palette.plum} size={.021} sizeAttenuation /></points>
      {NORDIC_CITIES.filter(city => ['Helsinki', 'Stockholm', 'Oslo', 'Copenhagen', 'Reykjavik'].includes(city.name)).map(city => <mesh key={city.name} position={globePosition(city.lat, city.lng, 1.022)}>
        <octahedronGeometry args={[.012, 0]} /><meshStandardMaterial color={palette.plum} emissive={palette.plum} emissiveIntensity={.6} roughness={.45} />
      </mesh>)}
    </group>
  </>;
}

export default function SystoleGlobeScene(props: Props) {
  return <Canvas dpr={[1, 1.5]} frameloop={props.active && !props.reduced ? 'always' : 'demand'} camera={{ position: globePosition(48, 8, 3.25), fov: 38, near: .1, far: 10 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}><World {...props} /></Canvas>;
}