export const FABRIC_FPS = 30;
export const FABRIC_MOVEMENT_SECONDS = 26;
export function useStillFabric({ reducedMotion, saveData, cores, memory }: {
  reducedMotion: boolean; saveData?: boolean; cores?: number; memory?: number;
}) {
  return reducedMotion || !!saveData || (cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 4);
}
export function fabricCanRender(visible: boolean, hidden: boolean, reducedMotion: boolean) {
  return visible && !hidden && !reducedMotion;
}
export function fabricFrameDue(now: number, last: number) { return now - last >= 1000 / FABRIC_FPS; }
export function fabricResolution(width: number, height: number) {
  const scale = Math.min(.5, 960 / Math.max(1, width), 540 / Math.max(1, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))] as const;
}