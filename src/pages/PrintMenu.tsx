import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { SUBJECTS, TERMS, ratingKey } from '../types';
import { Page } from '../ui';
import { ProLink } from './ProPage';
import templateUrl from '../assets/ecr-template.xlsx?url';
import { listTemplates, pickTemplate } from '../lib/templates';
import type { Template } from '../lib/templates';
import TemplateSettings from './TemplateSettings';

const FORMS = [
  { id: 'sf9', name: 'SF9 report card', desc: 'A4 landscape, two sides per learner.' },
  { id: 'pace', name: 'PACE form', desc: 'A4 portrait, all competencies with term ratings.' },
];
const SLOTS = 50; // same limit as the workbook (see exportEcr.ts)

const fileName = (section: string, year: string) =>
  `Grade-1-ECR-PACE-Form-and-SF9${[section, year].filter(Boolean).map((s) => `-${s}`).join('')}.xlsx`.replace(/[^\w.-]+/g, '-');

export default function PrintMenu() {
  const { info, learners, classes, classLearners, pro } = useStore();
  const [id, setId] = useState('all');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const loadTemplates = () => listTemplates().then(setTemplates).catch(() => setTemplates([]));
  useEffect(() => void loadTemplates(), []);
  const inUse = pickTemplate(templates, info.schoolYear);
  const open = (form: string) => window.open(`/print?form=${form}&id=${encodeURIComponent(id)}`, '_blank');

  // How complete the ratings are, per term, across the whole class.
  const progress = TERMS.map((t) => {
    const keys = SUBJECTS.flatMap((s) => s.items.filter((i) => i.src[t]).map((i) => ratingKey(i.id, t)));
    const rated = learners.reduce((n, l) => n + keys.filter((k) => l.ratings[k]).length, 0);
    const total = keys.length * learners.length;
    return { t, rated, total, pct: total ? Math.round((rated / total) * 100) : 0 };
  });
  const tooMany = (['M', 'F'] as const).filter((sex) => learners.filter((l) => l.sex === sex).length > SLOTS);

  async function exportXlsx() {
    setBusy(true);
    setNotice(null);
    try {
      const [{ fillEcr }, template] = await Promise.all([
        import('../lib/exportEcr'), // pulls in xlsx: load only when exporting
        inUse ? inUse.bytes : fetch(templateUrl).then(async (r) => new Uint8Array(await r.arrayBuffer())),
      ]);
      const bytes = fillEcr(template, { info, learners });
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName(info.section, info.schoolYear) });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setNotice({ text: `Downloaded ${a.download}.` });
    } catch (e) {
      setNotice({ text: `Couldn't create the workbook: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  const current = classes.filter((c) => !c.info.archived);

  // Every current class in one .zip: a filled workbook per class, each with its school year's template.
  async function exportAll() {
    setBusy(true);
    setNotice(null);
    try {
      const { fillEcr, zipFiles } = await import('../lib/exportEcr');
      const builtIn = new Uint8Array(await (await fetch(templateUrl)).arrayBuffer());
      const files: { name: string; bytes: Uint8Array }[] = [];
      const skipped: string[] = [];
      for (const c of current) {
        const list = await classLearners(c.id);
        if (!list.length || (['M', 'F'] as const).some((sex) => list.filter((l) => l.sex === sex).length > SLOTS)) {
          skipped.push(`${c.info.section || 'No section'} (${list.length ? `more than ${SLOTS} male or female learners` : 'no learners'})`);
          continue;
        }
        const template = pickTemplate(templates, c.info.schoolYear)?.bytes ?? builtIn;
        files.push({ name: fileName(c.info.section, c.info.schoolYear), bytes: fillEcr(template, { info: c.info, learners: list }) });
      }
      if (!files.length) throw new Error(`no class could be exported${skipped.length ? `: ${skipped.join(', ')}` : ''}.`);
      const zip = zipFiles(files);
      const url = URL.createObjectURL(new Blob([new Uint8Array(zip)], { type: 'application/zip' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `Grade-1-class-records-${new Date().toISOString().slice(0, 10)}.zip` });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setNotice({ text: `Downloaded ${a.download} with ${files.length} class${files.length === 1 ? '' : 'es'}.${skipped.length ? ` Skipped: ${skipped.join(', ')}.` : ''}` });
    } catch (e) {
      setNotice({ text: `Couldn't create the zip: ${(e as Error).message}`, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page title="Forms" hint="Print the SF9 and PACE forms, or export the whole class record to Excel.">
      <label className="mb-6 block max-w-md">
        <span className="label">Print for</span>
        <select className="field" value={id} onChange={(e) => setId(e.target.value)}>
          <option value="all">Whole class ({learners.length})</option>
          {learners.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {FORMS.map((f) => (
          <button key={f.id} onClick={() => open(f.id)} disabled={!learners.length}
            className="section p-5 text-left transition-colors hover:border-board hover:bg-board-soft disabled:pointer-events-none disabled:opacity-50">
            <p className="text-lg font-bold">{f.name}</p>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
            <p className="mt-4 text-sm font-bold text-board">Open print view</p>
          </button>
        ))}
      </div>

      <section className="section mt-8 max-w-3xl">
        <div className="section-head">
          <h2 className="font-bold">Export to Excel</h2>
          <span className="text-sm text-muted">Grade 1 ECR, PACE and SF9 workbook</span>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-muted">
            Downloads the official workbook filled in with your school details, learners, ratings, notes and attendance.
            Open it in Excel or Numbers; on the SF9 and PACE sheets, pick a learner's name in the Name cell to show their form.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {progress.map((p) => (
              <div key={p.t} className="rounded-lg border border-line px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold">Term {p.t}</span>
                  <span className={`text-sm font-bold ${p.pct === 100 ? 'text-board' : 'text-muted'}`}>{p.pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-board-soft" role="progressbar" aria-label={`Term ${p.t} ratings`} aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-board" style={{ width: `${p.pct}%` }} />
                </div>
                <p className="mt-1.5 text-[13px] text-muted">{p.rated.toLocaleString()} of {p.total.toLocaleString()} rated</p>
              </div>
            ))}
          </div>

          {tooMany.length > 0 && (
            <p className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm font-bold text-danger">
              The workbook has rows for {SLOTS} male and {SLOTS} female learners. Remove some {tooMany.map((s) => (s === 'M' ? 'male' : 'female')).join(' and ')} learners to export.
            </p>
          )}

          <p className="text-sm">
            Template for {info.schoolYear || 'this school year'}: <b>{inUse ? inUse.name : 'Built-in DepEd Grade 1 workbook'}</b>
            <span className="text-muted"> (change it under Templates below)</span>
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary" disabled={busy || !learners.length || tooMany.length > 0} onClick={exportXlsx}>
              {busy ? 'Creating workbook…' : 'Download Excel workbook'}
            </button>
            {current.length > 1 && (pro ? (
              <button className="btn-ghost" disabled={busy} onClick={exportAll}>
                Download all {current.length} current classes (.zip)
              </button>
            ) : <ProLink>Download all {current.length} classes (.zip)</ProLink>)}
            {progress.some((p) => p.pct < 100) && learners.length > 0 && (
              <span className="text-[13px] text-muted">Unrated competencies are left blank in the workbook.</span>
            )}
          </div>
          <p aria-live="polite">
            {notice && <span className={`block rounded-lg px-4 py-2.5 text-sm font-bold ${notice.error ? 'bg-danger/10 text-danger' : 'bg-board-soft text-board-dark'}`}>{notice.text}</span>}
          </p>
        </div>
      </section>

      {pro ? <TemplateSettings templates={templates} inUse={inUse} schoolYear={info.schoolYear} onChange={loadTemplates} /> : (
        <section className="section mt-6 flex flex-wrap items-center gap-3 p-5">
          <p className="min-w-0 flex-1 text-sm text-muted"><b className="text-ink">Templates</b>: use a new DepEd form version for chosen school years.</p>
          <ProLink>Add templates</ProLink>
        </section>
      )}
    </Page>
  );
}
