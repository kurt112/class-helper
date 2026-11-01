// Makes the blank export template (src/assets/ecr-template.xlsx) from a filled official workbook:
// clears every input cell and strips any leftover learner data. Run once when DepEd updates the form.
// Usage: npx vite-node scripts/make-ecr-template.ts path/to/FINAL-UPDATED-Grade-1-ECR-PACE-Form-and-SF9.xlsx
import { readFileSync, writeFileSync } from 'node:fs';
import { fillEcr } from '../src/lib/exportEcr';

const out = 'src/assets/ecr-template.xlsx';
writeFileSync(out, fillEcr(new Uint8Array(readFileSync(process.argv[2])), null));
console.log('wrote', out);
