// Manual check against a real workbook (not committed: it holds learner data).
// Usage: npx vite-node scripts/check-import.ts path/to/workbook.xlsx
import { readFileSync } from 'node:fs';
import { parseWorkbook } from '../src/lib/importXlsx';

const buf = readFileSync(process.argv[2]);
const { info, learners } = parseWorkbook(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
console.log(info.schoolName, info.section, info.months.map((m) => `${m.name}:${m.term}:${m.days}`).join(' '));
console.log(learners.length, 'learners;', learners.filter((l) => l.sex === 'F').length, 'female');
const l = learners[0];
console.log(l.name, l.lrn, l.birthdate, Object.keys(l.ratings).length, 'ratings', l.comments, l.attendance);
