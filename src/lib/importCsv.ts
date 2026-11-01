/** One learner row from a CSV of `whole name, lrn, birthdate`. */
export interface CsvLearner { line: number; name: string; lrn: string; birthdate: string }
export interface CsvResult { rows: CsvLearner[]; errors: { line: number; text: string; message: string }[] }

/** Splits one CSV line, honouring "quoted, fields" and "" escapes. */
function fields(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"', i++);
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') (out.push(cur), (cur = ''));
    else cur += ch;
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

/** "dela cruz, juan, santos" -> "DELA CRUZ, JUAN SANTOS" (the app's LAST, FIRST MIDDLE format). */
export function formatName(parts: string[]): string {
  const [last = '', ...rest] = parts.map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean);
  return (rest.length ? `${last}, ${rest.join(' ')}` : last).toUpperCase();
}

/** Accepts 2019-05-01, 05/01/2019 (month first, as in LIS exports) or 5/1/2019; returns ISO or null. */
export function parseDate(s: string): string | null {
  let y: number, m: number, d: number;
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]];
  else if (us) [y, m, d] = [+us[3], +us[1], +us[2]];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null; // e.g. 02/30
  return date.toISOString().slice(0, 10);
}

/** Splits CSV text into rows of fields (handles a BOM and Windows line endings). */
export const csvRows = (text: string) => text.replace(/^\uFEFF/, '').split(/\r?\n/).map(fields);

/**
 * Checks `whole name, lrn, birthdate` rows (from a CSV or an Excel sheet). The name itself contains commas
 * (LASTNAME, FIRSTNAME, MIDDLENAME), quoted or not, so the LAST two fields are LRN and birthdate
 * and everything before them is the name. A header row is skipped.
 */
export function parseLearnerRows(table: string[][]): CsvResult {
  const result: CsvResult = { rows: [], errors: [] };
  table.forEach((cells, i) => {
    const line = i + 1;
    const f = cells.map((c) => c.trim());
    const raw = f.join(',');
    if (f.every((x) => !x)) return; // blank rows, or ",,," rows Excel leaves at the end
    if (i === 0 && /name/i.test(raw) && !/\d{6}/.test(raw)) return; // header
    const fail = (message: string) => result.errors.push({ line, text: raw, message });
    if (f.length < 3) return fail('Needs 3 columns: whole name, LRN, birthdate.');
    const birth = f[f.length - 1];
    const lrn = f[f.length - 2].replace(/\s/g, '');
    const name = formatName(f.slice(0, -2).flatMap((p) => p.split(',')));
    if (!name) return fail('Name is empty.');
    if (/e\+/i.test(lrn)) return fail('LRN was turned into a number like 1.23E+11 by Excel. Format the LRN column as Text and export again.');
    if (lrn && !/^\d{12}$/.test(lrn)) return fail(`LRN "${lrn}" must be 12 digits.`);
    const birthdate = birth ? parseDate(birth) : '';
    if (birthdate === null) return fail(`Birthdate "${birth}" isn't a date. Use YYYY-MM-DD or MM/DD/YYYY.`);
    result.rows.push({ line, name, lrn, birthdate });
  });
  return result;
}

export const parseLearnerCsv = (text: string) => parseLearnerRows(csvRows(text));
