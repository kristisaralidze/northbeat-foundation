import { useEffect, useRef } from 'react';
import { AtmosphericImage } from './AtmosphericImage';
import desktop from '@/assets/northbeat-atmosphere.webp.asset.json';
import phone from '@/assets/northbeat-atmosphere-phone.webp.asset.json';
import { useStillFabric } from '@/lib/fabric-motion';

export function LivingFabric({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    if (!host || !canvas) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    let cancelled = false, generation = 0;
    let dispose: (() => void) | undefined;
    const start = async () => {
      const current = ++generation;
      dispose?.(); dispose = undefined;
      canvas.dataset['fabricReady'] = 'false';
      if (useStillFabric({ reducedMotion: motion.matches, saveData: device.connection?.saveData ?? false, cores: device.hardwareConcurrency, memory: device.deviceMemory ?? 8 })) return;
      try {
        const { mountFabric } = await import('./fabric-renderer');
        if (cancelled || current !== generation) return;
        dispose = mountFabric(canvas, host, matchMedia('(max-width: 767px)').matches ? phone.url : desktop.url);
      } catch { canvas.dataset['fabricReady'] = 'false'; }
    };
    void start();
    motion.addEventListener('change', start);
    return () => { cancelled = true; generation++; motion.removeEventListener('change', start); dispose?.(); };
  }, []);
  return <div ref={hostRef} className={`nb-living-fabric ${className}`} aria-hidden="true">
    <AtmosphericImage />
    <canvas ref={canvasRef} data-fabric-ready="false" />
  </div>;
}