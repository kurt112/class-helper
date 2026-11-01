import { describe, expect, it } from 'vitest';
import { mean, meanLetter, randomFill } from './randomFill';
import type { Letter } from '../types';

describe('randomFill', () => {
  it('hits the target average exactly from blank', () => {
    for (const target of ['A', 'B', 'C', 'D', 'E'] as Letter[]) {
      const out = randomFill([], 37, target);
      expect(out).toHaveLength(37);
      expect(meanLetter(out)).toBe(target);
      expect(mean(out)).toBe({ A: 5, B: 4, C: 3, D: 2, E: 1 }[target]);
    }
  });

  it('counts ratings already entered', () => {
    const existing: Letter[] = ['A', 'A', 'A', 'A'];
    const out = randomFill(existing, 20, 'C');
    expect(mean([...existing, ...out])).toBe(3);
  });

  it('actually varies and stays near the target', () => {
    const out = randomFill([], 50, 'B');
    expect(new Set(out).size).toBeGreaterThan(1);
    expect(out.every((l) => 'ABC'.includes(l))).toBe(true);
  });

  it('gets as close as it can when existing ratings are too far off', () => {
    const out = randomFill(['E', 'E', 'E', 'E', 'E', 'E'], 1, 'A');
    expect(out).toEqual(['A']);
  });

  it('does nothing with no blanks', () => {
    expect(randomFill(['B'], 0, 'A')).toEqual([]);
  });
});
