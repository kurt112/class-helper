import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRO_PRICE, classLabel, useStore } from '../store';
import { Empty, Page } from '../ui';

// Chrome/Edge fire this once at page load, before Settings opens, so catch it at module load.
let installPrompt: (Event & { prompt: () => Promise<void> }) | null = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e as typeof installPrompt; });

export default function SettingsPage() {
  const { classes, archiveYear, pro, proUntil, isAdmin } = useStore();
  const [done, setDone] = useState('');
  const [canInstall, setCanInstall] = useState(!!installPrompt);
  const installed = matchMedia('(display-mode: standalone)').matches;

  async function install() {
    await installPrompt?.prompt();
    installPrompt = null;
    setCanInstall(false);
  }

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
        <div className="section-head"><h2 className="font-bold">Plan</h2></div>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <p className="min-w-0 flex-1 text-sm text-muted">
            {isAdmin ? 'Administrator account.' : pro ? `Pro, until ${proUntil}.` : `Free plan. Pro is ${PRO_PRICE} per school year, paid in cash.`}
          </p>
          <Link className="btn-ghost" to="/pro">{pro ? 'View plan' : 'Get Pro'}</Link>
          {isAdmin && <Link className="btn-primary" to="/admin">Admin</Link>}
        </div>
      </section>

      <section className="section mt-6 max-w-3xl">
        <div className="section-head"><h2 className="font-bold">Install on this computer</h2></div>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <p className="min-w-0 flex-1 text-sm text-muted">
            {installed
              ? 'You are using the installed app.'
              : canInstall
                ? 'Add Elementary Class Record to your desktop or dock. It opens in its own window and works offline.'
                : 'In Chrome or Edge, click the install icon at the right of the address bar. In Safari, choose File › Add to Dock. On a phone, use Add to Home Screen.'}
          </p>
          {canInstall && !installed && <button className="btn-primary" onClick={install}>Install app</button>}
        </div>
      </section>

      <section className="section mt-6 max-w-3xl">
        <div className="section-head"><h2 className="font-bold">About</h2></div>
        <p className="px-5 py-4 text-sm text-muted">
          Elementary Class Record is free to use, with an optional paid Pro plan. It is not an official DepEd system. See the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/guide">Guide</a> for how to use every feature, and read the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/terms">Terms and Conditions</a> and the{' '}
          <a className="font-bold text-board underline-offset-2 hover:underline" href="/privacy">Data Privacy Notice</a>.
        </p>
      </section>
    </Page>
  );
}
