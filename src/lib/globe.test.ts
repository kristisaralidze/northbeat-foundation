import { describe, it, expect } from 'vitest';
import { clampGlobeDistance, isNordic, NORDIC_CITIES } from './globe';
describe('Nordic globe', () => {
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