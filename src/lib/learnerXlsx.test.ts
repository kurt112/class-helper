import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { makeTemplate, readLearnerWorkbook } from './learnerXlsx';
import { parseLearnerRows } from './importCsv';

const toBuffer = (wb: XLSX.WorkBook) => XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

describe('learner Excel template', () => {
  it('has Male, Female and Instructions sheets with Text-formatted LRN cells', () => {
    const wb = XLSX.read(toBuffer(makeTemplate()), { cellNF: true });
    expect(wb.SheetNames).toEqual(['Male', 'Female', 'Instructions']);
    expect(wb.Sheets.Male.B2.z).toBe('@');
  });

  it('an empty template imports nobody, with no errors', () => {
    const { M, F } = readLearnerWorkbook(toBuffer(makeTemplate()));
    expect(parseLearnerRows(M!)).toEqual({ rows: [], errors: [] });
    expect(parseLearnerRows(F!)).toEqual({ rows: [], errors: [] });
  });

  it('reads a filled template, including LRNs and dates Excel stored as numbers', () => {
    const wb = makeTemplate();
    XLSX.utils.sheet_add_aoa(wb.Sheets.Male, [['Dela Cruz, Juan, Santos', '123456789012', '05/14/2019']], { origin: 'A2' });
    // Typed without the Text format: Excel keeps the LRN as a number and the date as a date serial.
    wb.Sheets.Female.A2 = { t: 's', v: 'REYES, MARIA, LUISA' };
    wb.Sheets.Female.B2 = { t: 'n', v: 123456789013 };
    wb.Sheets.Female.C2 = { t: 'n', v: 43530, z: 'm/d/yy' }; // 2019-03-06
    const { M, F } = readLearnerWorkbook(toBuffer(wb));
    expect(parseLearnerRows(M!).rows).toEqual([{ line: 2, name: 'DELA CRUZ, JUAN SANTOS', lrn: '123456789012', birthdate: '2019-05-14' }]);
    expect(parseLearnerRows(F!).rows).toEqual([{ line: 2, name: 'REYES, MARIA LUISA', lrn: '123456789013', birthdate: '2019-03-06' }]);
  });

  it('falls back to the first sheet for any other workbook', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['SANTOS, PEDRO', '', '']]), 'Sheet1');
    const { first } = readLearnerWorkbook(toBuffer(wb));
    expect(parseLearnerRows(first!).rows).toEqual([{ line: 1, name: 'SANTOS, PEDRO', lrn: '', birthdate: '' }]);
  });
});
