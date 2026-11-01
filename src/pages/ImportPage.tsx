import { useState } from 'react';
import { useStore } from '../store';
import { ageAt } from '../lib/age';
import { parseLearnerCsv, parseLearnerRows } from '../lib/importCsv';
import type { CsvResult } from '../lib/importCsv';
import { learnerId } from '../types';
import type { Learner } from '../types';
import { Page } from '../ui';

type Sex = Learner['sex'];
interface Loaded extends CsvResult { file: string }

const SAMPLE = 'whole name,lrn,birthdate\n"DELA CRUZ, JUAN, SANTOS",123456789012,2019-05-14\n"REYES, PEDRO, GARCIA",123456789013,03/02/2019\n';
const SAMPLE_URL = `data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE)}`;

export default function ImportPage() {
  const { info, learners, addLearners } = useStore();
  const [files, setFiles] = useState<Partial<Record<Sex, Loaded>>>({});
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  async function load(sex: Sex, f: File | undefined) {
    if (!f) return;
    setNotice(null);
    try {
      const data = await f.arrayBuffer();
      // Go by the contents, not the name: Excel, Numbers and ODS files are zip packages (PK..), old .xls starts D0 CF.
      const head = new Uint8Array(data.slice(0, 2));
      const spreadsheet = (head[0] === 0x50 && head[1] === 0x4b) || (head[0] === 0xd0 && head[1] === 0xcf);
      if (!spreadsheet) {
        const parsed = parseLearnerCsv(new TextDecoder().decode(data));
        return setFiles((cur) => ({ ...cur, [sex]: { file: f.name, ...parsed } }));
      }
      const { readLearnerWorkbook } = await import('../lib/learnerXlsx'); // xlsx is large, load only when needed
      const book = readLearnerWorkbook(data);
      if (book.first) return setFiles((cur) => ({ ...cur, [sex]: { file: f.name, ...parseLearnerRows(book.first!) } }));
      // The template has a Male and a Female sheet: one file fills both lists, whichever box it was dropped on.
      setFiles((cur) => ({
        ...cur,
        ...(book.M && { M: { file: `${f.name}, Male sheet`, ...parseLearnerRows(book.M) } }),
        ...(book.F && { F: { file: `${f.name}, Female sheet`, ...parseLearnerRows(book.F) } }),
      }));
    } catch (e) {
      setNotice({ text: `Couldn't read ${f.name} (${(e as Error).message}). Save it as Excel (.xlsx) or CSV and try again.`, error: true });
    }
  }

  async function downloadTemplate() {
    try {
      (await import('../lib/learnerXlsx')).downloadTemplate();
    } catch (e) {
      setNotice({ text: `Couldn't create the template: ${(e as Error).message}`, error: true });
    }
  }

  // Decide each row's fate: new, already in the class, or repeated within the uploads.
  const seen = new Set(learners.map((l) => l.id));
  const plan = (['M', 'F'] as Sex[]).flatMap((sex) =>
    (files[sex]?.rows ?? []).map((r) => {
      const id = learnerId(sex, r.name, r.lrn);
      const status = learners.some((l) => l.id === id) ? 'exists' : seen.has(id) ? 'duplicate' : 'new';
      seen.add(id);
      return { ...r, sex, id, status } as const;
    }),
  );
  const ready = plan.filter((p) => p.status === 'new');

  async function save() {
    await addLearners(ready.map(({ id, name, lrn, sex, birthdate }) => ({ id, name, lrn, sex, birthdate, ratings: {}, comments: {}, attendance: [] })));
    setFiles({});
    setNotice({ text: `Added ${ready.length} learner${ready.length === 1 ? '' : 's'} to the class.` });
  }

  return (
    <Page
      title="Import learners"
      hint="Fill in the Excel template and drop it in either box: its Male and Female sheets load together. A CSV per list works too. Learners already in the class are left as they are."
      actions={<button className="btn-primary" onClick={downloadTemplate}>Download Excel template</button>}
    >
      <p aria-live="polite">{notice && <span className={`mb-6 block rounded-lg px-4 py-2.5 text-sm font-bold ${notice.error ? 'bg-danger/10 text-danger' : 'bg-board-soft text-board-dark'}`}>{notice.text}</span>}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {(['M', 'F'] as Sex[]).map((sex) => (
          <DropZone key={sex} sex={sex} loaded={files[sex]} onFile={(f) => load(sex, f)} onClear={() => setFiles((cur) => ({ ...cur, [sex]: undefined }))} />
        ))}
      </div>

      <section className="section mt-4 px-5 py-4 text-sm text-muted">
        <p className="font-bold text-ink">File format</p>
        <p className="mt-1">
          The <b className="text-ink">Excel template</b> has a Male sheet, a Female sheet and instructions; its LRN and birthdate columns are already set to Text.
          For a <b className="text-ink">CSV</b>, use three columns per row: <b className="text-ink">whole name</b> as LASTNAME, FIRSTNAME, MIDDLENAME, then <b className="text-ink">LRN</b> (12 digits), then <b className="text-ink">birthdate</b> (YYYY-MM-DD or MM/DD/YYYY).
          A header row is optional. LRN and birthdate may be left blank.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-paper px-3 py-2 font-[inherit] text-[13px] text-ink">{SAMPLE.trim()}</pre>
        <a className="mt-2 inline-block font-bold text-board underline-offset-2 hover:underline" href={SAMPLE_URL} download="learners-sample.csv">Download sample CSV</a>
      </section>

      {plan.length > 0 && (
        <section className="section mt-6">
          <div className="section-head">
            <h2 className="font-bold">Preview</h2>
            <span className="text-sm text-muted">{ready.length} to add{plan.length > ready.length && `, ${plan.length - ready.length} skipped`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[13px] text-muted">
                <tr className="border-b border-line">
                  <th className="px-5 py-2 font-bold">Name</th>
                  <th className="px-3 py-2 font-bold">Sex</th>
                  <th className="px-3 py-2 font-bold">LRN</th>
                  <th className="px-3 py-2 font-bold">Birthdate</th>
                  <th className="px-3 py-2 font-bold">Age at SY start</th>
                  <th className="px-5 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plan.map((p) => {
                  const age = ageAt(p.birthdate, info.syStart);
                  return (
                    <tr key={`${p.sex}-${p.line}`} className={p.status === 'new' ? '' : 'text-muted'}>
                      <td className="px-5 py-2 font-bold whitespace-nowrap">{p.name}</td>
                      <td className="px-3 py-2">{p.sex}</td>
                      <td className="px-3 py-2 tabular-nums">{p.lrn || '—'}</td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">{p.birthdate || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{age ? `${age.years} yrs ${age.months} mos` : '—'}</td>
                      <td className="px-5 py-2 whitespace-nowrap">
                        {p.status === 'new' ? <span className="font-bold text-board">New</span> : p.status === 'exists' ? 'Already in class' : 'Repeated in file'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-5 py-3">
            <button className="btn-ghost" onClick={() => setFiles({})}>Clear</button>
            <button className="btn-primary" disabled={!ready.length} onClick={save}>
              Add {ready.length} learner{ready.length === 1 ? '' : 's'}
            </button>
          </div>
        </section>
      )}
    </Page>
  );
}

function DropZone({ sex, loaded, onFile, onClear }: { sex: Sex; loaded?: Loaded; onFile: (f: File | undefined) => void; onClear: () => void }) {
  const [over, setOver] = useState(false);
  const label = sex === 'M' ? 'Male learners' : 'Female learners';
  return (
    <div className="section p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${sex === 'M' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'}`}>{sex}</span>
        <h2 className="font-bold">{label}</h2>
        {loaded && <button className="ml-auto text-sm font-bold text-muted hover:text-ink" onClick={onClear}>Remove</button>}
      </div>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors focus-within:border-board ${over ? 'border-board bg-board-soft' : 'border-line hover:border-board/50'}`}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => (e.preventDefault(), setOver(false), onFile(e.dataTransfer.files[0]))}
      >
        <input type="file" accept=".csv,.xlsx,.xls,.numbers,.ods,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" aria-label={`File for ${label.toLowerCase()}`} onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
        {loaded ? (
          <>
            <span className="font-bold">{loaded.file}</span>
            <span className="mt-1 text-muted">{loaded.rows.length} learner{loaded.rows.length === 1 ? '' : 's'} read{loaded.errors.length > 0 && `, ${loaded.errors.length} with problems`}. Choose another file to replace it.</span>
          </>
        ) : (
          <>
            <span className="font-bold text-board">Choose an Excel, Numbers or CSV file</span>
            <span className="mt-1 text-muted">or drop it here</span>
          </>
        )}
      </label>
      {!!loaded?.errors.length && (
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {loaded.errors.map((e) => (
            <li key={e.line} className="rounded-md bg-danger/10 px-3 py-1.5 text-danger">
              <b>Line {e.line}:</b> {e.message} <span className="block truncate opacity-75">{e.text}</span>
            </li>
          ))}
        </ul>
      )}
      {loaded && !loaded.rows.length && !loaded.errors.length && <p className="mt-3 text-[13px] text-muted">No learners found in this file.</p>}
    </div>
  );
}
