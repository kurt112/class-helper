import * as XLSX from 'xlsx';
import { DEFAULT_INFO, LETTERS, SUBJECTS, TERMS, learnerId, ratingKey } from '../types';
import type { ClassInfo, Learner, Letter, Month, Term } from '../types';

type Sheet = XLSX.WorkSheet;
const val = (ws: Sheet | undefined, r: number, c: number) =>
  ws?.[XLSX.utils.encode_cell({ r, c })]?.v as string | number | undefined;
const str = (v: unknown) => (v == null ? '' : String(v).trim());

function isoDate(v: unknown): string {
  if (typeof v !== 'number') return '';
  const d = XLSX.SSF.parse_date_code(v);
  return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
}

/** name -> row index, looking at column C (the VLOOKUP key column in every sheet). */
function rowsByName(ws: Sheet | undefined): Map<string, number> {
  const m = new Map<string, number>();
  if (!ws?.['!ref']) return m;
  const end = XLSX.utils.decode_range(ws['!ref']).e.r;
  for (let r = 0; r <= end; r++) {
    const n = str(val(ws, r, 2));
    if (n && !m.has(n)) m.set(n, r);
  }
  return m;
}

/** VLOOKUP(name, 'sheet'!C..., col) -> the cell value. */
function lookup(wb: XLSX.WorkBook, cache: Map<string, Map<string, number>>, sheet: string, name: string, col: number) {
  const ws = wb.Sheets[sheet];
  if (!cache.has(sheet)) cache.set(sheet, rowsByName(ws));
  const r = cache.get(sheet)!.get(name);
  return r === undefined ? undefined : val(ws, r, 2 + col - 1);
}

/** Reads the official Grade 1 ECR/PACE/SF9 workbook: class info, learners, ratings, comments, attendance. */
export function parseWorkbook(buf: ArrayBuffer): { info: ClassInfo; learners: Learner[] } {
  const wb = XLSX.read(buf, { type: 'array' });
  const input = wb.Sheets['INPUT DATA'];
  if (!input) throw new Error('This file has no "INPUT DATA" sheet. Is it the Grade 1 ECR workbook?');
  const f = (row: number) => str(val(input, row - 1, 5)); // column F

  const sf9 = wb.Sheets['SF9 - GRADE 1'];
  const months: Month[] = [];
  let term: Term = '1';
  for (let r = 24; r <= 35; r++) {
    const t = str(val(sf9, r, 11));
    if (TERMS.includes(t as Term)) term = t as Term;
    const name = str(val(sf9, r, 12));
    if (name) months.push({ name, term, days: Number(val(sf9, r, 14)) || 0 });
  }

  const info: ClassInfo = {
    ...DEFAULT_INFO,
    region: f(10), division: f(11), city: f(12), district: f(13), schoolId: f(15),
    schoolName: f(16), schoolYear: f(18) || DEFAULT_INFO.schoolYear, schoolHead: f(19),
    adviser: f(26), gradeLevel: f(27) || '1', section: f(28),
    months: months.length === 12 ? months : DEFAULT_INFO.months,
  };

  const cache = new Map<string, Map<string, number>>();
  const learners: Learner[] = [];
  for (const [sex, c] of [['M', 10], ['F', 15]] as const) {
    for (let r = 10; r < 120; r++) {
      const name = str(val(input, r, c + 1));
      if (!name) continue;
      const lrn = str(val(input, r, c + 2));
      const ratings: Record<string, Letter> = {};
      for (const s of SUBJECTS)
        for (const it of s.items)
          for (const [t, [sheet, col]] of Object.entries(it.src) as [Term, [string, number]][]) {
            const v = str(lookup(wb, cache, sheet, name, col)).toUpperCase();
            if (LETTERS.includes(v as Letter)) ratings[ratingKey(it.id, t)] = v as Letter;
          }
      const comments: Learner['comments'] = {};
      for (const t of TERMS) {
        // empty lookups show as 0 in the workbook
        const text = (col: number) => str(lookup(wb, cache, `TERM ${t} SUMMARY`, name, col)).replace(/^0$/, '');
        const can = text(12), improve = text(15);
        if (can || improve) comments[t] = { can, improve };
      }
      const attendance = info.months.map((_, i) => Number(lookup(wb, cache, 'G1 - ATTENDANCE SUMMARY', name, 4 + i)) || 0);
      learners.push({
        id: learnerId(sex, name, lrn),
        name, lrn, sex, birthdate: isoDate(val(input, r, c + 3)),
        ratings, comments, attendance,
      });
    }
  }
  return { info, learners };
}
