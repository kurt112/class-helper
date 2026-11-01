import type { Letter } from '../types';

// A (Advancing) is the highest level, E (Emerging) the lowest.
const VALUE: Record<Letter, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const LETTER = [undefined, 'E', 'D', 'C', 'B', 'A'] as Letter[];

export const mean = (rated: Letter[]) => (rated.length ? rated.reduce((s, l) => s + VALUE[l], 0) / rated.length : 0);
export const meanLetter = (rated: Letter[]): Letter | undefined => LETTER[Math.round(mean(rated))];

/**
 * Random letters for `blanks` empty slots so that, together with the `existing` ratings,
 * the average equals `target` (or gets as close as possible if existing ratings pull it too far).
 * Letters stay within one level of the target where possible, so the result looks natural.
 */
export function randomFill(existing: Letter[], blanks: number, target: Letter, rand = Math.random): Letter[] {
  if (blanks <= 0) return [];
  const t = VALUE[target];
  const have = existing.reduce((s, l) => s + VALUE[l], 0);
  const need = Math.min(5 * blanks, Math.max(blanks, t * (existing.length + blanks) - have));
  const base = Math.floor(need / blanks);
  const v = Array.from({ length: blanks }, (_, i) => base + (i < need - base * blanks ? 1 : 0));
  // Shuffle points between slots: the total (and so the average) never changes.
  const lo = Math.max(1, Math.min(base, t - 1));
  const hi = Math.min(5, Math.max(base + 1, t + 1));
  for (let k = 0; k < blanks * 4; k++) {
    const i = Math.floor(rand() * blanks);
    const j = Math.floor(rand() * blanks);
    if (i !== j && v[i] < hi && v[j] > lo) (v[i]++, v[j]--);
  }
  return v.map((x) => LETTER[x]);
}
