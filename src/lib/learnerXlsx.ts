// Excel side of the learner import. Kept apart from importCsv.ts because xlsx is large: load it lazily.
import * as XLSX from 'xlsx';

export const SHEETS = { M: 'Male', F: 'Female' } as const;
const HEADER = ['Whole name (LASTNAME, FIRSTNAME, MIDDLENAME)', 'LRN', 'Birthdate (YYYY-MM-DD or MM/DD/YYYY)'];
const ROWS = 80; // pre-formatted rows; more than any Grade 1 section needs

function learnerSheet() {
  const ws = XLSX.utils.aoa_to_sheet([HEADER]);
  // LRN and birthdate typed as Text, so Excel can't turn LRNs into 1.23E+11 or reformat dates.
  for (let r = 1; r <= ROWS; r++)
    for (const c of [1, 2]) ws[XLSX.utils.encode_cell({ r, c })] = { t: 's', v: '', z: '@' };
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ROWS, c: 2 } });
  ws['!cols'] = [{ wch: 44 }, { wch: 16 }, { wch: 36 }];
  ws['!autofilter'] = undefined;
  return ws;
}

/** The downloadable import template: a Male sheet, a Female sheet and an Instructions sheet. */
export function makeTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, learnerSheet(), SHEETS.M);
  XLSX.utils.book_append_sheet(wb, learnerSheet(), SHEETS.F);
  const help = XLSX.utils.aoa_to_sheet([
    ['How to fill in this template'],
    [],
    ['1. Put boys on the "Male" sheet and girls on the "Female" sheet, one learner per row, starting on row 2.'],
    ['2. Whole name: LASTNAME, FIRSTNAME, MIDDLENAME, all in one cell, separated by commas.'],
    ['3. LRN: the 12-digit Learner Reference Number. Leave blank if the learner has none yet.'],
    ['4. Birthdate: YYYY-MM-DD (2019-05-14) or MM/DD/YYYY (05/14/2019). Leave blank if unknown.'],
    ['5. Save, then drop this file on the Import page. Both sheets are read at once.'],
    [],
    ['Example row'],
    ['DELA CRUZ, JUAN, SANTOS', '123456789012', '2019-05-14'],
  ]);
  help['!cols'] = [{ wch: 96 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, help, 'Instructions');
  return wb;
}

export const downloadTemplate = () => XLSX.writeFile(makeTemplate(), 'learners-import-template.xlsx');

/** A sheet as rows of text cells (first 3 columns). Dates become YYYY-MM-DD; numbers keep every digit. */
function sheetRows(ws: XLSX.WorkSheet): string[][] {
  if (!ws['!ref']) return [];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = 0; c < 3; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
      if (!cell || cell.v == null) row.push('');
      else if (cell.t === 'n' && XLSX.SSF.is_date(cell.z ?? '')) row.push(XLSX.SSF.format('yyyy-mm-dd', cell.v));
      else if (cell.t === 'd') row.push((cell.v as Date).toISOString().slice(0, 10));
      else if (cell.t === 'n') row.push(String(cell.v)); // a 12-digit LRN typed as a number: String keeps all digits
      else row.push(String(cell.v));
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Reads a filled-in workbook. Sheets named Male / Female go to that list;
 * a workbook without them is read from its first sheet into `first`.
 */
export function readLearnerWorkbook(data: ArrayBuffer): { M?: string[][]; F?: string[][]; first?: string[][] } {
  const wb = XLSX.read(data, { cellNF: true }); // keep number formats, to tell dates from plain numbers
  const find = (name: string) => wb.SheetNames.find((n) => n.trim().toLowerCase() === name.toLowerCase());
  const m = find(SHEETS.M);
  const f = find(SHEETS.F);
  if (m || f) return { M: m ? sheetRows(wb.Sheets[m]) : undefined, F: f ? sheetRows(wb.Sheets[f]) : undefined };
  return { first: sheetRows(wb.Sheets[wb.SheetNames[0]]) };
}
