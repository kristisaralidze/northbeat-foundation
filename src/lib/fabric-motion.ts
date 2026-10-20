export const FABRIC_FPS = 60;
export const FABRIC_MOVEMENT_SECONDS = 4;
export function useStillFabric({ reducedMotion, saveData, cores, memory }: {
  reducedMotion: boolean; saveData?: boolean; cores?: number; memory?: number;
}) {
  return reducedMotion || !!saveData || (cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 4);
}
export function fabricCanRender(visible: boolean, hidden: boolean, reducedMotion: boolean) {
  return visible && !hidden && !reducedMotion;
}
export function fabricFrameDue(now: number, last: number) { return now - last >= 1000 / FABRIC_FPS - .5; }
export function fabricResolution(width: number, height: number, dpr = 1) {
  const scale = Math.max(1, Math.min(2, dpr));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))] as const;
}