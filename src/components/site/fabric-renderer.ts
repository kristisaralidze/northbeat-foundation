import * as THREE from 'three';
import { FABRIC_MOVEMENT_SECONDS, fabricCanRender, fabricFrameDue, fabricResolution } from '@/lib/fabric-motion';

const fragmentShader = /* glsl */ `
  uniform sampler2D uImage;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uScroll;
  uniform vec3 uLight;
  varying vec2 vUv;
  float folds(vec2 p, float t) {
    float bend = sin(p.x * 2.8 + t * .73) * .22 + sin(p.x * 5.1 - t * .41) * .06;
    float a = sin((p.y + bend) * 8.0 + p.x * 1.6 + t);
    float b = sin((p.y - bend * .7) * 12.0 - p.x * 2.2 - t * .618);
    float c = sin(p.y * 19.0 + sin(p.x * 4.0 + t * .37) - t * .43);
    return a * .55 + b * .28 + c * .09;
  }
  void main() {
    float t = uTime * 6.2831853 / ${FABRIC_MOVEMENT_SECONDS.toFixed(1)};
    vec2 p = (vUv - .5) * vec2(min(uAspect, 2.0), 1.0);
    p += uPointer * .025 + vec2(0., uScroll * .022);
    float h = folds(p, t);
    float dx = (folds(p + vec2(.003, 0.), t) - h) / .003;
    float dy = (folds(p + vec2(0., .003), t) - h) / .003;
    vec3 normal = normalize(vec3(-dx * .065, -dy * .065, 1.0));
    float light = dot(normal, normalize(vec3(-.45, .65, 1.0)));
    vec2 uv = vUv;
    // Preserve the photograph's cover crop and exact lilac/berry palette.
    if (uAspect > 1.5) uv.y = (uv.y - .5) * 1.5 / uAspect + .5;
    else uv.x = (uv.x - .5) * uAspect / 1.5 + .5;
    uv += vec2(sin(p.y * 4.0 + t * .61), h) * .018;
    uv += uPointer * .012 + vec2(0., uScroll * .012);
    vec3 silk = texture2D(uImage, clamp(uv, .001, .999)).rgb;
    float edge = smoothstep(.2, .65, length(vUv - .5));
    float shade = (1.0 - light) * .23 * (.35 + edge);
    silk *= 1.0 - shade;
    float sheen = pow(max(light, 0.), 12.0) * .14;
    silk = mix(silk, uLight, sheen);
    gl_FragColor = vec4(silk, 1.0);
    #include <colorspace_fragment>
  }
`;

/** One shaded full-screen triangle, no postprocessing or geometry-heavy scene. */
export function mountFabric(canvas: HTMLCanvasElement, host: HTMLElement, imageUrl: string) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: 'low-power', depth: false, stencil: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const uniforms = {
      uImage: { value: null as THREE.Texture | null }, uTime: { value: 0 }, uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2() }, uScroll: { value: 0 },
      uLight: { value: new THREE.Color(getComputedStyle(host).getPropertyValue('--fabric-light').trim()) },
  };
  const material = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, uniforms,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }',
    fragmentShader,
  });
  scene.add(new THREE.Mesh(geometry, material));
  let disposed = false, loaded = false, visible = false;
  let frame = 0, last = 0;
  let texture: THREE.Texture | undefined;
  const pointer = new THREE.Vector2();
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const resize = () => {
    const rect = host.getBoundingClientRect();
    const [w, h] = fabricResolution(rect.width, rect.height);
    renderer.setSize(w, h, false);
    uniforms.uAspect.value = rect.width / Math.max(1, rect.height);
  };
  const draw = (now: number) => {
    frame = 0;
    if (!loaded || !fabricCanRender(visible, document.hidden, motion.matches) || disposed) return;
    if (fabricFrameDue(now, last)) {
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      uniforms.uTime.value += dt;
      uniforms.uPointer.value.lerp(pointer, 1 - Math.exp(-2 * dt));
      const bounds = host.getBoundingClientRect();
      const scroll = Math.max(-1, Math.min(1, (innerHeight / 2 - bounds.top - bounds.height / 2) / innerHeight));
      uniforms.uScroll.value += (scroll - uniforms.uScroll.value) * (1 - Math.exp(-2 * dt));
      renderer.render(scene, camera);
      canvas.dataset['fabricTime'] = uniforms.uTime.value.toFixed(3);
      canvas.dataset['fabricState'] = 'running';
    }
    frame = requestAnimationFrame(draw);
  };
  const sync = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = performance.now();
    canvas.dataset['fabricState'] = 'paused';
    if (loaded && fabricCanRender(visible, document.hidden, motion.matches) && !disposed) frame = requestAnimationFrame(draw);
  };
  const observer = new IntersectionObserver(([entry]) => { visible = !!entry?.isIntersecting; sync(); });
  observer.observe(host);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const move = (event: PointerEvent) => {
    if (!visible || !finePointer.matches || event.pointerType === 'touch') return;
    pointer.set((event.clientX / innerWidth - .5) * 2, (.5 - event.clientY / innerHeight) * 2);
  };
  const contextLost = (event: Event) => { event.preventDefault(); loaded = false; canvas.dataset['fabricReady'] = 'false'; sync(); };
  canvas.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pointermove', move, { passive: true });
  resize();
  new THREE.TextureLoader().load(imageUrl, (image) => {
    if (disposed) { image.dispose(); return; }
    texture = image;
    image.colorSpace = THREE.SRGBColorSpace;
    uniforms.uImage.value = image;
    loaded = true;
    renderer.render(scene, camera);
    canvas.dataset['fabricReady'] = 'true';
    sync();
  }, undefined, () => { canvas.dataset['fabricReady'] = 'false'; });
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect(); resizer.disconnect();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pointermove', move);
    canvas.removeEventListener('webglcontextlost', contextLost);
    texture?.dispose(); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss();
  };
}