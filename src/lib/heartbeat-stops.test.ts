import { describe, expect, it } from 'vitest';
import { beatHeight, buildStops, dayAtProgress, sectionHeightVh, heightScale } from './heartbeat';

describe('heartbeat meaning', () => {
  it('heights', () => {
    expect(beatHeight([])).toBe(0.5);
    expect(beatHeight([{ kind: 'event' }])).toBe(3);
    expect(beatHeight([{ kind: 'opportunity' }])).toBe(4);
    expect(beatHeight([{ kind: 'event' }, { kind: 'event' }])).toBe(4.5);
    expect(beatHeight([{ kind: 'event' }, { kind: 'event' }, { kind: 'opportunity' }])).toBe(5.5);
  });
  it('section height clamps', () => {
    expect(sectionHeightVh(0)).toBe(300);
    expect(sectionHeightVh(4)).toBe(380);
    expect(sectionHeightVh(20)).toBe(650);
  });
  it('stops rest at day - 0.8 with equal shares', () => {
    const stops = buildStops([{ day: 5 }, { day: 20 }], -0.6, 30);
    expect(stops).toEqual([-0.6, 4.2, 19.2, 30]);
    expect(dayAtProgress(1 / 3, stops)).toBeCloseTo(4.2);
    expect(dayAtProgress(2 / 3, stops)).toBeCloseTo(19.2);
    expect(dayAtProgress(1, stops)).toBe(30);
  });
  it('tallest spike fits in 40% of screen', () => {
    const k = heightScale(5.5, 800, 680, 3.6);
    expect((680 / 3.6) * 5.5 * k).toBeLessThanOrEqual(320.0001);
  });
});
