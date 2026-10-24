import { describe, expect, it } from 'vitest';
import { cellIntro, linkIntro, openingProgress, relationIntro } from './living-cells';

describe('scroll-linked ecosystem opening', () => {
  it('progress runs from 85% to 25% of the screen', () => {
    expect(openingProgress(850, 1000)).toBe(0);
    expect(openingProgress(250, 1000)).toBe(1);
    expect(openingProgress(550, 1000)).toBeCloseTo(0.5);
  });
  it('startups appear by 0.15, others by 0.7', () => {
    expect(cellIntro(0, 0, 11)).toBe(0);
    expect(cellIntro(0.15, 0, 11)).toBe(1);
    expect(cellIntro(0.15, 1, 11)).toBe(0);
    expect(cellIntro(0.7, 10, 11)).toBeCloseTo(1);
  });
  it('links between 0.4 and 0.9, organisation lines after 0.9', () => {
    expect(linkIntro(0.4, 0, 12)).toBe(0);
    expect(linkIntro(0.9, 11, 12)).toBeCloseTo(1);
    expect(relationIntro(0.9)).toBe(0);
    expect(relationIntro(1)).toBe(1);
  });
});
