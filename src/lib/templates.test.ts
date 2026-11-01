import { describe, expect, it } from 'vitest';
import { parseYears, pickTemplate } from './templates';
import type { Template } from './templates';

const t = (id: string, years: string[], added: string): Template => ({ id, name: id, years, added, bytes: new Uint8Array(), warnings: [] });

describe('pickTemplate', () => {
  const list = [t('old', ['2026-2027'], '2026-06-01'), t('new', ['2026-2027', '2027-2028'], '2026-09-01'), t('next', ['2028-2029'], '2026-10-01')];

  it('uses the newest template listing the school year', () => {
    expect(pickTemplate(list, '2026-2027')?.id).toBe('new');
    expect(pickTemplate(list, ' 2027-2028 ')?.id).toBe('new');
    expect(pickTemplate(list, '2028-2029')?.id).toBe('next');
  });

  it('falls back to the built-in template (undefined) for other years', () => {
    expect(pickTemplate(list, '2030-2031')).toBeUndefined();
    expect(pickTemplate([], '2026-2027')).toBeUndefined();
  });
});

describe('parseYears', () => {
  it('splits on commas and spaces and drops repeats', () => {
    expect(parseYears('2026-2027, 2027-2028 2026-2027;')).toEqual(['2026-2027', '2027-2028']);
  });
});
