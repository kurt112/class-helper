import { useState } from 'react';
import { classLabel, useStore } from '../store';
import { Empty, Page } from '../ui';

export default function SettingsPage() {
  const { classes, archiveYear } = useStore();
  const [done, setDone] = useState('');

  // School years, newest first, with their active and archived classes.
  const years = [...new Set(classes.map((c) => c.info.schoolYear || 'No school year'))].sort().reverse().map((year) => ({
    year,
    active: classes.filter((c) => (c.info.schoolYear || 'No school year') === year && !c.info.archived),
    archived: classes.filter((c) => (c.info.schoolYear || 'No school year') === year && c.info.archived).length,
  }));

  async function archive(year: string, n: number) {
    if (!confirm(`Archive all ${n} class${n === 1 ? '' : 'es'} of ${year}? They stay under Archived in the class menu, with all their records.`)) return;
    await archiveYear(year === 'No school year' ? '' : year);
    setDone(`Archived ${n} class${n === 1 ? '' : 'es'} of ${year}.`);
  }

  return (
    <Page title="Settings">
      <section className="section max-w-3xl">
        <div className="section-head">
          <h2 className="font-bold">Archive by school year</h2>
          <span className="text-sm text-muted">At the end of a school year</span>
        </div>
        <p className="px-5 pt-4 text-sm text-muted">
          Archive every class of a finished school year at once. Archived classes keep all their learners, ratings and notes,
          and stay under "Archived" in the class menu, where you can open, print or restore them.
        </p>
        {years.length ? (
          <ul className="mt-2 divide-y divide-line">
            {years.map(({ year, active, archived }) => (
              <li key={year} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{year}</p>
                  <p className="truncate text-sm text-muted">
                    {active.length ? active.map((c) => classLabel(c.info)).join(', ') : 'No active classes'}
                    {archived > 0 && ` · ${archived} archived`}
                  </p>
                </div>
                <button className="btn-ghost" disabled={!active.length} onClick={() => archive(year, active.length)}>
                  {active.length ? `Archive all (${active.length})` : 'All archived'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-5"><Empty>No classes yet.</Empty></div>
        )}
        <p aria-live="polite" className="px-5 pb-4 empty:hidden">
          {done && <span className="block rounded-lg bg-board-soft px-4 py-2.5 text-sm font-bold text-board-dark">{done}</span>}
        </p>
      </section>

      <section className="section mt-6 max-w-3xl">
        <div className="section-head"><h2 className="font-bold">About</h2></div>
        <p className="px-5 py-4 text-sm text-muted">
          Elementary Class Record is a free tool for educational use. It is not an official DepEd system. See the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/guide">Guide</a> for how to use every feature, and read the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/terms">Terms and Conditions</a> and the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/privacy">Data Privacy Notice</a>.
        </p>
      </section>
    </Page>
  );
}
