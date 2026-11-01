import { useState } from 'react';
import { deleteTemplate, parseYears, saveTemplate } from '../lib/templates';
import type { Template } from '../lib/templates';
import templateUrl from '../assets/ecr-template.xlsx?url';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const download = (bytes: Uint8Array, name: string) => {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: XLSX_TYPE }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** Settings: which Excel template the export uses for each school year. */
export default function TemplateSettings({ templates, inUse, schoolYear, onChange }: {
  templates: Template[]; inUse?: Template; schoolYear: string; onChange: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [years, setYears] = useState(schoolYear);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean; list?: string[] } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMsg({ text: 'Choose the Excel workbook to use as a template.', error: true });
    const ys = parseYears(years);
    if (!ys.length) return setMsg({ text: 'Enter at least one school year, e.g. 2027-2028.', error: true });
    setBusy(true);
    setMsg(null);
    try {
      const { checkTemplate } = await import('../lib/exportEcr'); // pulls in xlsx: load only when needed
      // Blanked before saving: no learner data from the uploaded file is kept.
      const { blank, warnings } = checkTemplate(new Uint8Array(await file.arrayBuffer()));
      const t: Template = { id: crypto.randomUUID(), name: name.trim() || file.name.replace(/\.xlsx$/i, ''), years: ys, bytes: blank, added: new Date().toISOString(), warnings };
      await saveTemplate(t);
      setMsg(warnings.length
        ? { text: `Added "${t.name}". Its PACE sheet doesn't show ${warnings.length} rating${warnings.length === 1 ? '' : 's'} from the right cells, so check the PACE form after exporting:`, list: warnings }
        : { text: `Added "${t.name}" for ${ys.join(', ')}.` });
      setFile(null);
      setName('');
      onChange();
    } catch (err) {
      setMsg({ text: `Can't use ${file.name}: ${(err as Error).message} Templates need the same sheets and layout as the DepEd Grade 1 ECR workbook.`, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function setTemplateYears(t: Template, text: string) {
    const ys = parseYears(text);
    if (ys.join() === t.years.join()) return;
    await saveTemplate({ ...t, years: ys });
    onChange();
  }

  async function remove(t: Template) {
    if (!confirm(`Delete the template "${t.name}"? Exports for ${t.years.join(', ') || 'its school years'} go back to the built-in template.`)) return;
    await deleteTemplate(t.id);
    onChange();
  }

  const badge = (on: boolean) => on && <span className="rounded-full bg-board-soft px-2 py-0.5 text-[12px] font-bold text-board-dark">In use for {schoolYear}</span>;

  return (
    <section className="section mt-6 max-w-3xl">
      <div className="section-head">
        <h2 className="font-bold">Templates</h2>
        <span className="text-sm text-muted">Which Excel workbook the export fills</span>
      </div>
      <ul className="divide-y divide-line">
        <li className="flex flex-wrap items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-bold">Built-in: DepEd Grade 1 ECR, PACE and SF9 {badge(!inUse)}</p>
            <p className="text-sm text-muted">Used for any school year that has no template of its own.</p>
          </div>
          <button className="btn-ghost" onClick={async () => download(new Uint8Array(await (await fetch(templateUrl)).arrayBuffer()), 'Grade-1-ECR-template.xlsx')}>Download</button>
        </li>
        {templates.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">{t.name} {badge(inUse?.id === t.id)}</p>
              <label className="mt-1.5 flex items-center gap-2 text-sm text-muted">
                School years
                <input className="field h-8 max-w-64" key={t.years.join()} defaultValue={t.years.join(', ')} placeholder="2027-2028" onBlur={(e) => setTemplateYears(t, e.target.value)} />
              </label>
              {t.warnings.length > 0 && <p className="mt-1 text-[13px] text-danger">{t.warnings.length} PACE rating{t.warnings.length === 1 ? '' : 's'} read from other cells; check the PACE form.</p>}
            </div>
            <button className="btn-ghost" onClick={() => download(t.bytes, `${t.name}.xlsx`)}>Download</button>
            <button className="btn px-2 text-danger hover:bg-danger/10" onClick={() => remove(t)}>Delete</button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="grid gap-3 border-t border-line bg-paper px-5 py-4 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
        <label>
          <span className="label">Excel workbook</span>
          <input type="file" accept=".xlsx" className="field py-1.5 file:mr-2 file:border-0 file:bg-transparent file:font-bold file:text-board" onChange={(e) => setFile(e.target.files?.[0] ?? null)} key={file ? 'set' : 'empty'} />
        </label>
        <label>
          <span className="label">Name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder={file?.name.replace(/\.xlsx$/i, '') ?? 'e.g. DepEd ECR 2027 update'} />
        </label>
        <label>
          <span className="label">School years</span>
          <input className="field" value={years} onChange={(e) => setYears(e.target.value)} placeholder="2026-2027, 2027-2028" />
        </label>
        <button className="btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Add template'}</button>
      </form>
      <div aria-live="polite" className="px-5 pb-4 empty:hidden">
        {msg && (
          <div className={`rounded-lg px-4 py-2.5 text-sm ${msg.error ? 'bg-danger/10 font-bold text-danger' : 'bg-board-soft text-board-dark'}`}>
            <p className="font-bold">{msg.text}</p>
            {msg.list && <ul className="mt-1 list-disc pl-5">{msg.list.slice(0, 6).map((w) => <li key={w}>{w}</li>)}{msg.list.length > 6 && <li>…and {msg.list.length - 6} more</li>}</ul>}
          </div>
        )}
      </div>
      <p className="px-5 pb-4 text-[13px] text-muted">
        Upload a filled or empty copy of the workbook: learner data in it is removed, only the form is kept. Templates are saved in this browser on this device.
      </p>
    </section>
  );
}
