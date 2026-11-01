import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { checkTemplate, excelDate, fillEcr, paceProblems, setCells, showWhiteText, zipFiles } from './exportEcr';
import { DEFAULT_INFO, SUBJECTS, ratingKey } from '../types';
import type { Learner } from '../types';

const template = new Uint8Array(readFileSync('src/assets/ecr-template.xlsx'));
const read = (bytes: Uint8Array) => XLSX.read(bytes, { cellFormula: true, cellNF: true, cellStyles: true, sheetStubs: true });

const item = SUBJECTS[0].items[0]; // first Reading & Literacy competency
const [ratingSheet] = item.src['1']!;
const learner = (name: string, sex: Learner['sex'], extra: Partial<Learner> = {}): Learner => ({
  id: name, name, sex, lrn: '', birthdate: '', ratings: {}, comments: {}, attendance: [], ...extra,
});
const juan = learner('DELA CRUZ, JUAN SANTOS', 'M', {
  lrn: '123456789012', birthdate: '2019-05-14',
  ratings: { [ratingKey(item.id, '1')]: 'B' },
  comments: { '1': { can: 'Reads well & <fast>', improve: 'Spelling' } },
  attendance: [16, 20],
});
const maria = learner('REYES, MARIA LUISA', 'F', { ratings: { [ratingKey(item.id, '1')]: 'A' } });
const info = { ...DEFAULT_INFO, schoolName: 'Test School', schoolId: '123456', adviser: 'T. Adviser', schoolHead: 'P. Head', section: 'ROSE' };

describe('fillEcr', () => {
  const out = read(fillEcr(template, { info, learners: [juan, maria] }));
  const tpl = read(template);

  it('writes school info, learners and signatures into the input cells', () => {
    const input = out.Sheets['INPUT DATA'];
    expect(input.F16.v).toBe('Test School');
    expect(input.F15.v).toBe(123456);
    expect(input.F28.v).toBe('ROSE');
    expect(input.L11.v).toBe('DELA CRUZ, JUAN SANTOS');
    expect(input.M11.v).toBe('123456789012');
    expect(input.N11.v).toBe(excelDate('2019-05-14'));
    expect(input.L12?.v ?? '').toBe('');
    expect(input.Q11.v).toBe('REYES, MARIA LUISA');
    expect(out.Sheets['SF9 - GRADE 1'].M72.v).toBe('T. Adviser');
    expect(out.Sheets['SF9 - GRADE 1'].M75.v).toBe('P. Head');
    expect(out.Sheets['SF9 - GRADE 1'].D15.v).toBe('DELA CRUZ, JUAN SANTOS');
    expect(out.Sheets['SF9 - GRADE 1'].O25.v).toBe(16); // June class days
    expect(out.Sheets['SF9 - GRADE 1'].C10.v).toBe('TEST SCHOOL'); // header placeholder replaced
    expect(out.Sheets['SF9 - GRADE 1'].C13.v).toBe('School Year 2026-2027');
    expect(out.Sheets['SF9 - GRADE 1'].C5.v).toBe('Region'); // not filled in: placeholder kept
  });

  it('writes ratings, comments and attendance on the learner rows', () => {
    const col = XLSX.utils.encode_col(item.src['1']![1] + 1);
    expect(out.Sheets[ratingSheet][`${col}15`].v).toBe('B'); // first male row
    expect(out.Sheets[ratingSheet][`${col}66`].v).toBe('A'); // first female row
    expect(out.Sheets['TERM 1 SUMMARY'].N14.v).toBe('Reads well & <fast>');
    expect(out.Sheets['TERM 1 SUMMARY'].Q14.v).toBe('Spelling');
    expect(out.Sheets['G1 - ATTENDANCE SUMMARY'].F13.v).toBe(16);
    expect(out.Sheets['G1 - ATTENDANCE SUMMARY'].G13.v).toBe(20);
    expect(out.Sheets['G1 - ATTENDANCE SUMMARY'].H13?.v ?? '').toBe(''); // not entered
  });

  it('keeps every formula and every cell format of the template', () => {
    for (const name of tpl.SheetNames) {
      const a = tpl.Sheets[name], b = out.Sheets[name];
      for (const ref of Object.keys(a)) {
        if (ref[0] === '!') continue;
        expect(b[ref]?.f, `${name}!${ref} formula`).toBe(a[ref].f);
        expect(b[ref]?.s, `${name}!${ref} format`).toEqual(a[ref].s);
      }
    }
  });

  it('tells Excel to recalculate on open', () => {
    const z = XLSX.CFB.read(fillEcr(template, { info, learners: [] }), { type: 'array' });
    const wbXml = new TextDecoder().decode(XLSX.CFB.find(z, '/xl/workbook.xml')!.content as Uint8Array);
    expect(wbXml).toContain('fullCalcOnLoad="1"');
  });

  it('refuses more learners than the workbook has rows for', () => {
    const many = Array.from({ length: 51 }, (_, i) => learner(`BOY ${i}`, 'M'));
    expect(() => fillEcr(template, { info, learners: many })).toThrow(/room for 50 male/);
  });
});

describe('setCells', () => {
  it('replaces, adds and clears cells in column order, keeping styles', () => {
    const xml = '<sheetData><row r="2"><c r="A2" s="3"><v>1</v></c><c r="C2" s="4"/></row><row r="5"><c r="B5"><v>9</v></c></row></sheetData>';
    const out = setCells(xml, new Map<string, string | number | null>([['C2', 'x<y'], ['B2', 7], ['A2', null], ['D4', 'new']]));
    expect(out).toBe(
      '<sheetData><row r="2"><c r="A2" s="3"/><c r="B2"><v>7</v></c><c r="C2" s="4" t="inlineStr"><is><t xml:space="preserve">x&lt;y</t></is></c></row>' +
      '<row r="4"><c r="D4" t="inlineStr"><is><t xml:space="preserve">new</t></is></c></row><row r="5"><c r="B5"><v>9</v></c></row></sheetData>',
    );
  });
});

describe('template PACE sheet', () => {
  it('reads every competency from exactly the column the app writes it to', () => {
    expect(paceProblems(read(template))).toEqual([]);
  });
});

describe('checkTemplate', () => {
  it('accepts the built-in template, blanked, with no warnings', () => {
    const { blank, warnings } = checkTemplate(template);
    expect(warnings).toEqual([]);
    expect(read(blank).Sheets['INPUT DATA'].L11?.v ?? '').toBe('');
  });

  it('rejects a workbook that is not the ECR form', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['hello']]), 'Sheet1');
    expect(() => checkTemplate(new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })))).toThrow(/no "/);
  });
});


describe('showWhiteText', () => {
  it('gives white-on-no-fill styles a black font, and leaves white text on dark fills alone', () => {
    const styles =
      '<styleSheet><fonts count="2"><font><color theme="1"/></font><font><b/><color theme="0"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002060"/></patternFill></fill></fills>' +
      '<cellXfs count="3"><xf fontId="0" fillId="0"/><xf fontId="1" fillId="0"/><xf fontId="1" fillId="1"/></cellXfs></styleSheet>';
    const out = showWhiteText(styles);
    expect(out).toContain('<fonts count="3">');
    expect(out).toContain('<font><b/><color theme="1"/></font></fonts>'); // black copy keeps bold
    expect(out).toContain('<xf fontId="2" fillId="0"/>'); // invisible style now black
    expect(out).toContain('<xf fontId="1" fillId="1"/>'); // white on navy untouched
  });
});

describe('zipFiles', () => {
  it('packs files into a zip, renaming repeated names', () => {
    const a = new TextEncoder().encode('first'), b = new TextEncoder().encode('second');
    const z = XLSX.CFB.read(zipFiles([{ name: 'ROSE.xlsx', bytes: a }, { name: 'ROSE.xlsx', bytes: b }]), { type: 'array' });
    const names = z.FullPaths.filter((p) => !p.endsWith('/') && !p.includes('Sh33tJ5')).map((p) => p.replace(/^Root Entry\//, ''));
    expect(names.sort()).toEqual(['ROSE (2).xlsx', 'ROSE.xlsx']);
    expect(new TextDecoder().decode(XLSX.CFB.find(z, '/ROSE (2).xlsx')!.content as Uint8Array)).toBe('second');
  });
});
