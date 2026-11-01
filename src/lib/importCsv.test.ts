import { describe, expect, it } from 'vitest';
import { parseDate, parseLearnerCsv } from './importCsv';

describe('parseLearnerCsv', () => {
  it('reads quoted and unquoted names, skips the header, handles BOM and CRLF', () => {
    const csv = '﻿whole name,lrn,birthdate\r\n"Dela Cruz, Juan, Santos",123456789012,2019-05-01\r\nREYES, MARIA, LUISA,123456789013,05/02/2019\r\n';
    const { rows, errors } = parseLearnerCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { line: 2, name: 'DELA CRUZ, JUAN SANTOS', lrn: '123456789012', birthdate: '2019-05-01' },
      { line: 3, name: 'REYES, MARIA LUISA', lrn: '123456789013', birthdate: '2019-05-02' },
    ]);
  });

  it('allows a blank LRN, blank birthdate and a missing middle name', () => {
    const { rows } = parseLearnerCsv('"Santos, Pedro",,\nSantos, Ana,,');
    expect(rows).toEqual([
      { line: 1, name: 'SANTOS, PEDRO', lrn: '', birthdate: '' },
      { line: 2, name: 'SANTOS, ANA', lrn: '', birthdate: '' },
    ]);
  });

  it('reports bad rows with their line number and keeps the good ones', () => {
    const { rows, errors } = parseLearnerCsv('"A, B, C",1.23457E+11,2019-01-01\n"D, E, F",12345,2019-01-01\n"G, H, I",123456789012,02/30/2019\n"J, K, L",123456789014,2019-01-01\n,,\n');
    expect(rows.map((r) => r.line)).toEqual([4]);
    expect(errors.map((e) => [e.line, e.message.slice(0, 12)])).toEqual([[1, 'LRN was turn'], [2, 'LRN "12345" '], [3, 'Birthdate "0']]);
  });
});

describe('parseDate', () => {
  it('handles ISO and month-first dates and rejects impossible ones', () => {
    expect(parseDate('2019-5-1')).toBe('2019-05-01');
    expect(parseDate('12/31/2019')).toBe('2019-12-31');
    expect(parseDate('31/12/2019')).toBeNull();
    expect(parseDate('May 1')).toBeNull();
  });
});
