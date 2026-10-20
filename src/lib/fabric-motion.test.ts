import { describe, expect, it } from 'vitest';
import { FABRIC_MOVEMENT_SECONDS, fabricCanRender, fabricFrameDue, fabricResolution, useStillFabric } from './fabric-motion';
describe('living fabric performance', () => {
  it('uses the still image for reduced motion', () => {
    expect(useStillFabric({ reducedMotion: true, cores: 8, memory: 8 })).toBe(true);
    expect(useStillFabric({ reducedMotion: false, cores: 8, memory: 8 })).toBe(false);
  });
  it('uses the still image on low-power and data-saving devices', () => {
    expect(useStillFabric({ reducedMotion: false, cores: 2 })).toBe(true);
    expect(useStillFabric({ reducedMotion: false, memory: 4 })).toBe(true);
    expect(useStillFabric({ reducedMotion: false, saveData: true })).toBe(true);
  });
  it('does not render off-screen', () => {
    expect(fabricCanRender(false, false, false)).toBe(false);
    expect(fabricCanRender(true, false, false)).toBe(true);
  });
  it('does not render in hidden tabs', () => { expect(fabricCanRender(true, true, false)).toBe(false); });
  it('targets 60 fps without dropping normal display frames', () => {
    expect(fabricFrameDue(8.33, 0)).toBe(false);
    expect(fabricFrameDue(1000 / 60, 0)).toBe(true);
  });
  it('sweeps large folds every 3 to 5 seconds', () => {
    expect(FABRIC_MOVEMENT_SECONDS).toBeGreaterThanOrEqual(3);
    expect(FABRIC_MOVEMENT_SECONDS).toBeLessThanOrEqual(5);
  });
  it('renders at device resolution capped at 2x', () => {
    expect(fabricResolution(1280, 600)).toEqual([1280, 600]);
    expect(fabricResolution(390, 844, 2)).toEqual([780, 1688]);
    expect(fabricResolution(390, 844, 3)).toEqual([780, 1688]);
  });
});