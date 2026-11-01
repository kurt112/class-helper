// Export: fills the official Grade 1 ECR / PACE / SF9 workbook with the class.
// It edits the workbook's XML directly and touches only the cells a teacher types in, so the
// formatting, logos, dropdowns and formulas stay exactly as in the original file.
import * as XLSX from 'xlsx';
import { SUBJECTS, TERMS, ratingKey } from '../types';
import type { ClassInfo, Learner, Term } from '../types';

type Value = string | number | null; // null clears the cell (keeping its formatting)
type Edits = Map<string, Map<string, Value>>; // sheet name -> cell ref -> value

export const SLOTS = 50; // the workbook has rows for 50 male and 50 female learners
const FIRST_INPUT_ROW = 11; // INPUT DATA row of the first learner
const INPUT_COLS = { M: ['L', 'M', 'N'], F: ['Q', 'R', 'S'] } as const; // name, LRN, birthdate
const INFO_ROWS: [keyof ClassInfo, number][] = [
  ['region', 10], ['division', 11], ['city', 12], ['district', 13], ['schoolId', 15], ['schoolName', 16],
  ['schoolYear', 18], ['schoolHead', 19], ['adviser', 26], ['gradeLevel', 27], ['section', 28],
];

const col = (i: number) => XLSX.utils.encode_col(i);
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dec = new TextDecoder();
const enc = new TextEncoder();

/** ISO date -> Excel date serial (what the workbook's date cells hold). */
export const excelDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000;
};

/**
 * For every sheet: which sheet row shows the learner in INPUT DATA row N, per sex.
 * Found from the name formulas in column C, e.g. =IF('INPUT DATA'!L11="","",'INPUT DATA'!L11).
 */
function learnerRows(wb: XLSX.WorkBook) {
  const out = new Map<string, Record<Learner['sex'], Map<number, number>>>();
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows = { M: new Map<number, number>(), F: new Map<number, number>() };
    for (const ref of Object.keys(ws)) {
      if (!ref.startsWith('C') || !ws[ref].f) continue;
      const m = (ws[ref].f as string).match(/^IF\('INPUT DATA'!([LQ])(\d+)=""/);
      if (m) rows[m[1] === 'L' ? 'M' : 'F'].set(+m[2], XLSX.utils.decode_cell(ref).r + 1);
    }
    if (rows.M.size || rows.F.size) out.set(name, rows);
  }
  return out;
}

/** All the cell edits for the class; with no class, every input cell is cleared (the blank template). */
function buildEdits(wb: XLSX.WorkBook, data: { info: ClassInfo; learners: Learner[] } | null): Edits {
  const edits: Edits = new Map();
  const set = (sheet: string, ref: string, v: Value) => {
    if (!wb.Sheets[sheet]) throw new Error(`The template has no "${sheet}" sheet.`);
    if (!edits.has(sheet)) edits.set(sheet, new Map());
    edits.get(sheet)!.set(ref, v);
  };
  const info = data?.info;
  const bySex = { M: data?.learners.filter((l) => l.sex === 'M') ?? [], F: data?.learners.filter((l) => l.sex === 'F') ?? [] };
  for (const sex of ['M', 'F'] as const)
    if (bySex[sex].length > SLOTS)
      throw new Error(`The workbook has room for ${SLOTS} ${sex === 'M' ? 'male' : 'female'} learners; this class has ${bySex[sex].length}.`);

  // School information
  for (const [key, row] of INFO_ROWS) {
    const v = info ? String(info[key] ?? '').trim() : '';
    set('INPUT DATA', `F${row}`, !v ? null : /^\d+$/.test(v) && (key === 'schoolId' || key === 'gradeLevel') ? Number(v) : v);
  }
  // Class days per month on the SF9 attendance table (rows 25-36)
  for (let i = 0; i < 12; i++) {
    const m = info?.months[i];
    set('SF9 - GRADE 1', `M${25 + i}`, m ? m.name : null);
    set('SF9 - GRADE 1', `O${25 + i}`, m ? m.days : null);
  }
  // SF9 header lines are typed placeholders ("Region", "ABC ELEMENTARY SCHOOL"...): replace the ones the teacher filled in.
  if (info) {
    const header: [string, string, string][] = [
      ['C5', info.region, info.region], ['C6', info.division, `SCHOOLS DIVISION OFFICE OF ${info.division}`.toUpperCase()],
      ['C7', info.district, info.district], ['C8', info.city, info.city],
      ['C10', info.schoolName, info.schoolName.toUpperCase()], ['C13', info.schoolYear, `School Year ${info.schoolYear}`],
    ];
    for (const [ref, given, text] of header) if (given.trim()) set('SF9 - GRADE 1', ref, text.trim());
  }
  // SF9 signature lines are typed names in the original, not links to INPUT DATA.
  set('SF9 - GRADE 1', 'M72', info?.adviser.trim() || null);
  set('SF9 - GRADE 1', 'M75', info?.schoolHead.trim() || null);
  // The learner shown on the SF9 and PACE sheets: the first one (the teacher picks others in Excel).
  const first = data?.learners[0]?.name ?? null;
  set('SF9 - GRADE 1', 'D15', first);
  set('PACE - GRADE 1', 'G6', first);

  const rows = learnerRows(wb);
  const rowIn = (sheet: string, sex: Learner['sex'], slot: number) => {
    const r = rows.get(sheet)?.[sex].get(FIRST_INPUT_ROW + slot);
    if (r === undefined) throw new Error(`Sheet "${sheet}" has no row for learner ${slot + 1}.`);
    return r;
  };

  // Blank template: also clear anything typed on learner rows outside the known columns (ratings in
  // not-assessed cells that still have a dropdown, stray pastes), so no learner's data is left behind.
  if (!data) {
    const ratingSheets = new Set(SUBJECTS.flatMap((s) => s.items.flatMap((it) => Object.values(it.src).map(([sh]) => sh))));
    for (const sheet of ratingSheets) {
      const ws = wb.Sheets[sheet];
      const learnerRows = new Set([...(rows.get(sheet)?.M.values() ?? []), ...(rows.get(sheet)?.F.values() ?? [])]);
      for (const ref of Object.keys(ws)) {
        if (ref[0] === '!' || ws[ref].f || String(ws[ref].v ?? '').trim() === '') continue;
        const { r, c } = XLSX.utils.decode_cell(ref);
        if (c >= 10 && learnerRows.has(r + 1)) set(sheet, ref, null);
      }
    }
  }

  for (const sex of ['M', 'F'] as const) {
    for (let slot = 0; slot < SLOTS; slot++) {
      const l: Learner | undefined = bySex[sex][slot];
      const inputRow = FIRST_INPUT_ROW + slot;
      const [cName, cLrn, cBirth] = INPUT_COLS[sex];
      set('INPUT DATA', `${cName}${inputRow}`, l?.name || null);
      set('INPUT DATA', `${cLrn}${inputRow}`, l?.lrn || null);
      set('INPUT DATA', `${cBirth}${inputRow}`, l?.birthdate ? excelDate(l.birthdate) : null);

      // Ratings: item.src[term] = [sheet, VLOOKUP column counted from column C]
      for (const s of SUBJECTS)
        for (const it of s.items)
          for (const [t, [sheet, c]] of Object.entries(it.src) as [Term, [string, number]][])
            set(sheet, `${col(c + 1)}${rowIn(sheet, sex, slot)}`, l?.ratings[ratingKey(it.id, t)] ?? null);

      for (const t of TERMS) {
        const sheet = `TERM ${t} SUMMARY`;
        const r = rowIn(sheet, sex, slot);
        set(sheet, `N${r}`, l?.comments[t]?.can || null); // What your child can do
        set(sheet, `Q${r}`, l?.comments[t]?.improve || null); // What your child is learning to improve
      }

      const att = 'G1 - ATTENDANCE SUMMARY';
      const r = rowIn(att, sex, slot);
      // 0 is written as blank, like months not yet entered in the original; SF9 reads blank as 0 days.
      for (let i = 0; i < 12; i++) set(att, `${col(5 + i)}${r}`, l?.attendance[i] || null);
    }
  }
  return edits;
}

const cellXml = (ref: string, attrs: string, v: Value) => {
  const style = attrs.match(/\ss="\d+"/)?.[0] ?? '';
  if (v === null) return `<c r="${ref}"${style}/>`;
  if (typeof v === 'number') return `<c r="${ref}"${style}><v>${v}</v></c>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
};
const colIndex = (ref: string) => XLSX.utils.decode_cell(ref).c;

/** Applies cell edits to one worksheet's XML, keeping every other cell byte for byte. */
export function setCells(xml: string, edits: Map<string, Value>): string {
  const byRow = new Map<number, Map<string, Value>>();
  for (const [ref, v] of edits) {
    const r = XLSX.utils.decode_cell(ref).r + 1;
    if (!byRow.has(r)) byRow.set(r, new Map());
    byRow.get(r)!.set(ref, v);
  }
  const rowXml = (r: number, attrs: string, inner: string) => {
    const want = byRow.get(r)!;
    const cells: { ref: string; xml: string }[] = [];
    for (const m of inner.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>[\s\S]*?<\/c>)/g)) {
      const ref = m[1];
      cells.push({ ref, xml: want.has(ref) ? cellXml(ref, m[2], want.get(ref)!) : m[0] });
      want.delete(ref);
    }
    for (const [ref, v] of want) if (v !== null) cells.push({ ref, xml: cellXml(ref, '', v) });
    cells.sort((a, b) => colIndex(a.ref) - colIndex(b.ref));
    byRow.delete(r);
    return `<row${attrs}>${cells.map((c) => c.xml).join('')}</row>`;
  };
  let out = xml.replace(/<row\b([^>]*?\br="(\d+)"[^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, (whole, attrs: string, r: string, inner = '') =>
    byRow.has(+r) ? rowXml(+r, attrs.replace(/\/$/, ''), inner) : whole,
  );
  // Rows that didn't exist yet: insert them in order.
  for (const r of [...byRow.keys()].sort((a, b) => a - b)) {
    if (![...byRow.get(r)!.values()].some((v) => v !== null)) continue;
    const row = rowXml(r, ` r="${r}"`, '');
    const after = [...out.matchAll(/<row\b[^>]*?\br="(\d+)"/g)].find((m) => +m[1] > r);
    if (after) out = out.slice(0, after.index) + row + out.slice(after.index);
    else out = out.replace(/<sheetData\s*\/>/, `<sheetData>${row}</sheetData>`).replace('</sheetData>', `${row}</sheetData>`);
  }
  return out;
}

/** Drops formulas' saved results, so they can't carry old data; Excel recalculates on open. */
/**
 * The DepEd file gives some SF9 cells (age at end of SY, Term 2-3 attendance and comments) white text on no fill,
 * so their values are invisible. Point every white-text, no-fill style at a black copy of its font (white text on a
 * dark fill, like the navy header bars, is left alone).
 */
export function showWhiteText(styles: string): string {
  const section = (tag: string) => styles.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`))!;
  const fonts = section('fonts')[1].match(/<font>[\s\S]*?<\/font>|<font\/>/g)!;
  const fills = section('fills')[1].match(/<fill>[\s\S]*?<\/fill>|<fill\/>/g)!;
  const xfs = section('cellXfs')[1].match(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)!;
  const id = (xf: string, k: string) => +xf.match(new RegExp(`${k}="(\\d+)"`))![1];
  const newFonts: string[] = [];
  const fixed = xfs.map((xf) => {
    const font = fonts[id(xf, 'fontId')];
    const white = /<color (?:theme="0"|rgb="FFFFFFFF")\/>/;
    if (!white.test(font) || /patternType="solid"/.test(fills[id(xf, 'fillId')])) return xf;
    newFonts.push(font.replace(white, '<color theme="1"/>'));
    return xf.replace(/fontId="\d+"/, `fontId="${fonts.length + newFonts.length - 1}"`);
  });
  if (!newFonts.length) return styles;
  return styles
    .replace(section('fonts')[0], section('fonts')[0].replace(/count="\d+"/, `count="${fonts.length + newFonts.length}"`).replace('</fonts>', `${newFonts.join('')}</fonts>`))
    .replace(section('cellXfs')[1], fixed.join(''));
}

const stripFormulaResults = (xml: string) =>
  xml.replace(/<c\b([^>]*?)>(<f[\s\S]*?)<\/c>/g, (_, attrs: string, inner: string) =>
    `<c${attrs.replace(/\st="[^"]*"/, '')}>${inner.replace(/<v>[\s\S]*?<\/v>/, '')}</c>`);

/** Blanks shared strings no cell uses any more (e.g. names that were in cleared cells). */
function purgeSharedStrings(xml: string, sheets: string[]) {
  const used = new Set<number>();
  for (const s of sheets) for (const m of s.matchAll(/<c\b[^>]*?\bt="s"[^>]*>\s*<v>(\d+)<\/v>/g)) used.add(+m[1]);
  let i = 0;
  return xml.replace(/<si>[\s\S]*?<\/si>|<si\/>/g, (si) => (used.has(i++) ? si : '<si><t></t></si>'));
}

/**
 * Mismatches between the PACE sheet's formulas and the columns the app writes ratings to.
 * Empty means every competency shows on the PACE form from exactly its own cell.
 */
export function paceProblems(wb: XLSX.WorkBook): string[] {
  const ws = wb.Sheets['PACE - GRADE 1'];
  if (!ws) return ['The workbook has no "PACE - GRADE 1" sheet.'];
  const TERM: Record<string, string> = { G: '1', H: '2', I: '3', P: '1', Q: '2', R: '3' };
  const problems: string[] = [];
  const seen = new Map<string, number>(); // "sheet#k@term" -> PACE cells reading it
  for (const ref of Object.keys(ws)) {
    const m = (ws[ref]?.f as string | undefined)?.match(/^VLOOKUP\(G6,'([^']+)'!C\d+:([A-Z]+)\d+,(\d+),0\)$/);
    if (!m || !/READING|LANGUAGE/.test(m[1])) continue;
    const term = TERM[ref.replace(/\d+$/, '')];
    if (!m[1].startsWith(`TERM ${term} `)) problems.push(`PACE ${ref} (Term ${term}) reads ${m[1]}.`);
    if (XLSX.utils.decode_col(m[2]) < +m[3] + 1) problems.push(`PACE ${ref}: lookup range ends before column ${m[3]}.`);
    const key = `${m[1]}#${m[3]}@${term}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const s of SUBJECTS)
    for (const it of s.items)
      for (const [t, [sheet, k]] of Object.entries(it.src))
        if (/READING|LANGUAGE/.test(sheet) && seen.get(`${sheet}#${k}@${t}`) !== 1)
          problems.push(`${s.name} ${it.no}${it.text.match(/^([a-z])\./)?.[1] ?? ''} ${it.skill ?? ''}, Term ${t}: not shown on the PACE form.`);
  return problems;
}

/**
 * Prepares an uploaded workbook as an export template: blanks it (no learner data is kept) and checks it.
 * Throws when the structure doesn't fit the export; `warnings` lists PACE formulas that read other cells.
 */
export function checkTemplate(bytes: Uint8Array): { blank: Uint8Array; warnings: string[] } {
  const blank = fillEcr(bytes, null);
  return { blank, warnings: paceProblems(XLSX.read(blank, { type: 'array', cellFormula: true, sheetStubs: true })) };
}

/**
 * Fills the template with the class and returns the new .xlsx bytes.
 * With `data` null it makes the blank template from a filled workbook: all inputs cleared,
 * saved formula results and leftover strings removed, author details cleared.
 */
export function fillEcr(template: Uint8Array, data: { info: ClassInfo; learners: Learner[] } | null): Uint8Array {
  // sheetStubs: keep formula cells that have no saved result (the template has none).
  const wb = XLSX.read(template, { type: 'array', cellFormula: true, sheetStubs: true });
  const edits = buildEdits(wb, data);
  const zip = XLSX.CFB.read(template, { type: 'array' });
  const file = (path: string) => {
    const e = XLSX.CFB.find(zip, `/${path}`); // entries are found by '/'-rooted paths
    if (!e?.content) throw new Error(`The template is missing ${path}.`);
    return e;
  };
  const read = (path: string) => dec.decode(file(path).content as Uint8Array);
  const write = (path: string, text: string) => void (file(path).content = enc.encode(text));

  // Sheet name -> worksheet XML path, via workbook.xml and its relationships.
  const rels = new Map([...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const workbook = read('xl/workbook.xml');
  const sheetPath = new Map(
    [...workbook.matchAll(/<sheet\b[^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g)].map((m) => {
      const target = rels.get(m[2])!.replace(/^\/?(xl\/)?/, '');
      return [m[1].replace(/&amp;/g, '&'), `xl/${target}`];
    }),
  );

  const sheetXml: string[] = [];
  for (const [name, path] of sheetPath) {
    let xml = read(path);
    if (edits.has(name)) xml = setCells(xml, edits.get(name)!);
    if (!data) xml = stripFormulaResults(xml);
    write(path, xml);
    sheetXml.push(xml);
  }

  if (!data) {
    write('xl/sharedStrings.xml', purgeSharedStrings(read('xl/sharedStrings.xml'), sheetXml));
    write('xl/styles.xml', showWhiteText(read('xl/styles.xml')));
    write('docProps/core.xml', read('docProps/core.xml')
      .replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, '<dc:creator></dc:creator>')
      .replace(/<cp:lastModifiedBy>[\s\S]*?<\/cp:lastModifiedBy>/, '<cp:lastModifiedBy></cp:lastModifiedBy>'));
  }
  // Make Excel recalculate every formula when the file opens.
  write('xl/workbook.xml', /<calcPr\b[^>]*fullCalcOnLoad/.test(workbook) ? workbook : workbook.replace(/<calcPr\b/, '<calcPr fullCalcOnLoad="1"'));

  return XLSX.CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }) as Uint8Array;
}

/** Packs files into one .zip (e.g. a workbook per class); repeated names get " (2)", " (3)"... */
export function zipFiles(files: { name: string; bytes: Uint8Array }[]): Uint8Array {
  const zip = XLSX.CFB.utils.cfb_new();
  const used = new Map<string, number>();
  for (const f of files) {
    const n = (used.get(f.name) ?? 0) + 1;
    used.set(f.name, n);
    XLSX.CFB.utils.cfb_add(zip, n === 1 ? f.name : f.name.replace(/(\.\w+)?$/, ` (${n})$1`), f.bytes);
  }
  return XLSX.CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }) as Uint8Array;
}
