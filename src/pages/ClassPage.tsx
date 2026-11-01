import { useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { classLabel, useStore } from '../store';
import { ageAt } from '../lib/age';
import { Empty, Page } from '../ui';
import { learnerId } from '../types';
import type { ClassInfo, Learner } from '../types';

const FIELDS: [keyof ClassInfo, string, string?][] = [
  ['schoolName', 'School name'], ['schoolId', 'School ID'], ['region', 'Region'], ['division', 'Division'],
  ['city', 'City / municipality'], ['district', 'District'], ['schoolYear', 'School year'],
  ['syStart', 'First day of SY', 'date'], ['syEnd', 'Last day of SY', 'date'],
  ['schoolHead', 'School head'], ['adviser', 'Adviser'], ['gradeLevel', 'Grade level'], ['section', 'Section'],
];
const TERM_IDS = ['1', '2', '3'] as const;

export default function ClassPage() {
  const { user, info, learners, classes, classId, deleteClass, saveInfo, addLearner, removeLearner, replaceAll } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({ name: '', lrn: '', sex: 'M' as Learner['sex'], birthdate: '' });
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    try {
      const { parseWorkbook } = await import('../lib/importXlsx'); // xlsx is large, load only when importing
      const parsed = parseWorkbook(await f.arrayBuffer());
      if (confirm(`Import ${parsed.learners.length} learners with their ratings, notes and attendance from "${f.name}"?\n\nThis replaces everything in this class.`)) {
        await replaceAll(parsed.info, parsed.learners);
        setNotice({ text: `Imported ${parsed.learners.length} learners from ${f.name}.` });
      }
    } catch (e) {
      setNotice({ text: `Couldn't import ${f.name}: ${(e as Error).message}`, error: true });
    } finally {
      file.current!.value = '';
    }
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim().toUpperCase();
    if (!name) return setNotice({ text: 'Enter the learner’s name.', error: true });
    const lrn = draft.lrn.trim();
    if (lrn && !/^\d{12}$/.test(lrn)) return setNotice({ text: 'LRN must be 12 digits.', error: true });
    const id = learnerId(draft.sex, name, lrn);
    if (learners.some((l) => l.id === id)) return setNotice({ text: `${name} is already in the class.`, error: true });
    void addLearner({ id, name, lrn, sex: draft.sex, birthdate: draft.birthdate, ratings: {}, comments: {}, attendance: [] });
    setDraft({ ...draft, name: '', lrn: '', birthdate: '' });
    setNotice({ text: `Added ${name}.` });
  }

  return (
    <Page
      title="Class"
      hint="School details, class days and learners. Changes save when you leave a field."
      actions={<>
        <button className="btn-ghost" onClick={() => file.current?.click()}>Import Excel</button>
        <button className="btn-ghost" onClick={() => saveInfo({ archived: !info.archived })}>{info.archived ? 'Restore class' : 'Archive class'}</button>
        <button
          className="btn-ghost text-danger hover:bg-danger/10"
          onClick={() => setDeleting(true)}
        >{classes.length > 1 ? 'Delete class' : 'Clear class'}</button>
        {/* phones have no sidebar, so sign-out lives here */}
        {user && <button className="btn-ghost md:hidden" onClick={() => signOut(auth)}>Sign out</button>}
      </>}
    >
      {deleting && classId && (
        <DeleteClassDialog
          info={info} learners={learners.length} onlyClass={classes.length === 1}
          onCancel={() => setDeleting(false)}
          onDelete={() => (setDeleting(false), void deleteClass(classId))}
        />
      )}
      <input ref={file} type="file" accept=".xlsx" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {info.archived ? (
        <p className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-3 text-sm">
          <span><b>Archived class.</b> It's kept for your records and listed under Archived in the class menu.</span>
          <button className="btn-ghost" onClick={() => saveInfo({ archived: false })}>Restore class</button>
        </p>
      ) : info.syEnd && info.syEnd < new Date().toISOString().slice(0, 10) && (
        <p className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-board-soft px-4 py-3 text-sm text-board-dark">
          <span><b>School year {info.schoolYear} ended on {info.syEnd}.</b> Archive this class (or every class of that year, in Settings) and start the new year with "+ New class".</span>
          <button className="btn-primary" onClick={() => saveInfo({ archived: true })}>Archive this class</button>
        </p>
      )}
      <div aria-live="polite">
        {notice && (
          <p className={`mb-6 flex items-start justify-between gap-4 rounded-lg px-4 py-2.5 text-sm font-bold ${notice.error ? 'bg-danger/10 text-danger' : 'bg-board-soft text-board-dark'}`}>
            {notice.text}
            <button aria-label="Dismiss" className="opacity-70 hover:opacity-100" onClick={() => setNotice(null)}>✕</button>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="section self-start">
          <div className="section-head"><h2 className="font-bold">Learners</h2><span className="text-sm text-muted">{learners.length} enrolled</span></div>
          <form onSubmit={add} className="grid gap-3 border-b border-line bg-paper px-5 py-4 sm:grid-cols-6">
            <label className="sm:col-span-6">
              <span className="label">Name</span>
              <input className="field" placeholder="DELA CRUZ, JUAN SANTOS" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <label className="sm:col-span-2">
              <span className="label">LRN</span>
              <input className="field" inputMode="numeric" maxLength={12} placeholder="12 digits" value={draft.lrn} onChange={(e) => setDraft({ ...draft, lrn: e.target.value })} />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Birthdate</span>
              <input className="field" type="date" value={draft.birthdate} onChange={(e) => setDraft({ ...draft, birthdate: e.target.value })} />
            </label>
            <label>
              <span className="label">Sex</span>
              <select className="field" value={draft.sex} onChange={(e) => setDraft({ ...draft, sex: e.target.value as Learner['sex'] })}>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </label>
            <div className="flex items-end"><button className="btn-primary w-full">Add</button></div>
          </form>
          {learners.length ? (
            <ul className="divide-y divide-line">
              {learners.map((l) => {
                const age = ageAt(l.birthdate, info.syStart);
                return (
                  <li key={l.id} className="flex items-center gap-4 px-5 py-3">
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${l.sex === 'M' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'}`}
                      title={l.sex === 'M' ? 'Male' : 'Female'}
                    >{l.sex}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{l.name}</p>
                      <p className="text-sm text-muted">LRN {l.lrn || 'not set'}, {age ? `${age.years} yrs ${age.months} mos at SY start` : 'no birthdate'}</p>
                    </div>
                    <button
                      className="btn px-2 text-danger hover:bg-danger/10"
                      onClick={() => confirm(`Remove ${l.name}? Their ratings and notes are deleted too.`) && void removeLearner(l.id)}
                    >Remove</button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5"><Empty>No learners yet. Add them above, or import your Excel class record.</Empty></div>
          )}
        </section>

        <div className="space-y-6">
          <section className="section">
            <div className="section-head"><h2 className="font-bold">School</h2></div>
            <div className="grid gap-3 p-5">
              {FIELDS.map(([key, label, type]) => (
                <label key={key}>
                  <span className="label">{label}</span>
                  {/* key on the stored value re-syncs the field when it changes elsewhere */}
                  <input
                    className="field" type={type ?? 'text'}
                    key={info[key] as string} defaultValue={info[key] as string}
                    onBlur={(e) => e.target.value !== info[key] && saveInfo({ [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head"><h2 className="font-bold">Class days</h2><span className="text-sm text-muted">per month</span></div>
            <div className="space-y-4 p-5">
              {TERM_IDS.map((t) => (
                <fieldset key={t}>
                  <legend className="label">Term {t}</legend>
                  <div className="divide-y divide-line rounded-md border border-line">
                    {info.months.map((m, i) => m.term === t && (
                      <label key={i} className="flex items-center justify-between gap-3 px-3 py-1.5">
                        <span>{m.name}</span>
                        <input
                          className="field h-8 w-20 text-right" type="number" min={0} max={31}
                          key={m.days} defaultValue={m.days}
                          onBlur={(e) => {
                            const days = Number(e.target.value) || 0;
                            if (days !== m.days) saveInfo({ months: info.months.map((x, j) => (j === i ? { ...x, days } : x)) });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}

/** Delete needs the class's name typed in, so a class is never deleted by a slip of the finger. */
function DeleteClassDialog({ info, learners, onlyClass, onCancel, onDelete }: {
  info: ClassInfo; learners: number; onlyClass: boolean; onCancel: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState('');
  useEffect(() => ref.current?.showModal(), []);
  const name = info.section.trim() || 'DELETE'; // a class without a section is confirmed with the word DELETE
  const ok = typed.trim().toUpperCase() === name.toUpperCase();
  return (
    <dialog
      ref={ref} onClose={onCancel} aria-labelledby="del-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <form method="dialog" onSubmit={(e) => { e.preventDefault(); if (ok) onDelete(); }} className="space-y-4 p-5">
        <h2 id="del-title" className="text-lg font-bold">{onlyClass ? 'Clear' : 'Delete'} {classLabel(info)}?</h2>
        <p className="text-sm text-muted">
          This deletes the class and its {learners} learner{learners === 1 ? '' : 's'}, with every rating, note and attendance record. It can't be undone.
          {' '}To keep it for your records instead, archive it.
        </p>
        <label className="block">
          <span className="label">Type <b className="text-ink">{name}</b> to confirm</span>
          <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn bg-danger text-on-board hover:bg-danger/90" disabled={!ok}>{onlyClass ? 'Clear class' : 'Delete class'}</button>
        </div>
      </form>
    </dialog>
  );
}
