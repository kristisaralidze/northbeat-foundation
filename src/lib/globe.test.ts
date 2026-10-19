import { describe, it, expect } from 'vitest';
import { clampGlobeDistance, globeScrollDistance, recoverGlobeRotation, GLOBE_ROTATION_SPEED, isNordic, NORDIC_CITIES } from './globe';
describe('Nordic globe', () => {
  it('scrolls closer and reverses to the whole globe with bounded endpoints', () => {
    expect(globeScrollDistance(0)).toBe(3.3);
    expect(globeScrollDistance(1)).toBe(2.35);
    expect(globeScrollDistance(.5)).toBeCloseTo(2.825);
    expect(globeScrollDistance(-1)).toBe(3.3);
    expect(globeScrollDistance(2)).toBe(2.35);
  });
  it('stops while dragging and gradually resumes slow rotation after release', () => {
    expect(recoverGlobeRotation(GLOBE_ROTATION_SPEED, 1, true)).toBe(0);
    const first = recoverGlobeRotation(0, .1, false);
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(GLOBE_ROTATION_SPEED);
    expect(recoverGlobeRotation(first, 10, false)).toBeCloseTo(GLOBE_ROTATION_SPEED);
  });
  it('highlights only the five Nordic countries', () => {
    expect(['FIN','SWE','NOR','DNK','ISL','DEU','RUS','USA'].filter(isNordic)).toEqual(['FIN','SWE','NOR','DNK','ISL']);
  });
  it('marks the ten requested Nordic cities', () => {
    expect(NORDIC_CITIES.map(c=>c.name)).toEqual(['Helsinki','Espoo','Turku','Tampere','Oulu','Stockholm','Gothenburg','Copenhagen','Oslo','Reykjavik']);
  });
  it('bounds zoom so the camera never passes through the globe or disappears', () => {
    expect(clampGlobeDistance(.2)).toBe(1.7); expect(clampGlobeDistance(15)).toBe(4.2); expect(clampGlobeDistance(3)).toBe(3);
  });
});