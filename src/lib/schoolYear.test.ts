import { describe, expect, it } from 'vitest';
import { nextClassInfo } from './schoolYear';
import { DEFAULT_INFO } from '../types';

const info = { ...DEFAULT_INFO, section: 'ROSE', schoolName: 'Banaba ES', schoolYear: '2026-2027', syStart: '2026-06-08', syEnd: '2027-04-08', archived: true };

describe('nextClassInfo', () => {
  it('keeps the school year while it is still running', () => {
    const n = nextClassInfo(info, '2026-11-02');
    expect([n.schoolYear, n.syStart, n.syEnd, n.section, n.archived, n.schoolName]).toEqual(['2026-2027', '2026-06-08', '2027-04-08', '', false, 'Banaba ES']);
  });

  it('moves to the next school year once it has ended', () => {
    const n = nextClassInfo(info, '2027-05-01');
    expect([n.schoolYear, n.syStart, n.syEnd]).toEqual(['2027-2028', '2027-06-08', '2028-04-08']);
  });
});
