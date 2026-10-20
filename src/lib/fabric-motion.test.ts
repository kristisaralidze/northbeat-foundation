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
  it('caps rendering at 30 fps', () => {
    expect(fabricFrameDue(33, 0)).toBe(false);
    expect(fabricFrameDue(1000 / 30, 0)).toBe(true);
  });
  it('keeps a full movement within 20 to 30 seconds', () => {
    expect(FABRIC_MOVEMENT_SECONDS).toBeGreaterThanOrEqual(20);
    expect(FABRIC_MOVEMENT_SECONDS).toBeLessThanOrEqual(30);
  });
  it('renders at half resolution with bounded buffers', () => {
    expect(fabricResolution(1280, 600)).toEqual([640, 300]);
    expect(fabricResolution(3840, 2160)).toEqual([960, 540]);
  });
});