import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ADMIN_EMAIL, PRO_PRICE, today, useStore } from '../store';
import { Empty, Page } from '../ui';

const PRO_FEATURES = [
  'More than one class (and a new class each school year)',
  'Random fill and Re-rate to a target average',
  'Re-rate ticked learners at once',
  'Download all classes as one zip',
  'Templates for new DepEd form versions',
];

/** Stands in for a Pro-only button when the teacher is on the free plan. */
export function ProLink({ children }: { children: ReactNode }) {
  return (
    <Link to="/pro" className="btn-ghost">
      {children}
      <span className="rounded bg-board px-1.5 py-0.5 text-[11px] text-on-board">PRO</span>
    </Link>
  );
}

const fmt = (d: string) => new Date(`${d}T00:00`).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

/** /pro: what Pro includes and how to pay in cash. */
export function ProPage() {
  const { user, pro, proUntil, isAdmin } = useStore();
  const [copied, setCopied] = useState(false);
  const email = user?.email ?? '';
  const expired = !!proUntil && proUntil < today();

  return (
    <Page title="Pro" hint={`${PRO_PRICE} per school year, paid in cash. Everything else stays free.`}>
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="section p-5">
          <h2 className="font-bold">Your plan</h2>
          {isAdmin ? <p className="mt-2 text-muted">Admin account: Pro is always on.</p>
            : pro ? <p className="mt-2"><b className="text-board">Pro is active</b> until {fmt(proUntil!)}.</p>
            : <p className="mt-2 text-muted">{expired ? `Your Pro ended on ${fmt(proUntil!)}.` : 'Free plan.'} Rating, notes, printing and the Excel export of one class are free.</p>}
          <h3 className="mt-5 text-sm font-bold text-muted">Pro adds</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">{PRO_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>

        {!pro && (
          <section className="section p-5">
            <h2 className="font-bold">How to get Pro</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed">
              <li>Pay <b>{PRO_PRICE}</b> in cash to the app administrator, in person. Ask for an acknowledgement receipt.</li>
              <li>
                Give the administrator the Google email you sign in with:
                <span className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 truncate rounded bg-board-soft px-2 py-1 text-sm">{email}</code>
                  <button className="btn-ghost h-8" onClick={() => navigator.clipboard?.writeText(email).then(() => setCopied(true))}>{copied ? 'Copied' : 'Copy'}</button>
                </span>
              </li>
              <li>Pro turns on by itself once it's activated, usually the same day. It lasts until the end of the school year.</li>
            </ol>
            <p className="mt-4 text-sm text-muted">
              Never send money online or to anyone claiming to be from this app. Questions:{' '}
              <a className="font-bold text-board" href={`mailto:${ADMIN_EMAIL}`}>{ADMIN_EMAIL}</a>. See the{' '}
              <a className="font-bold text-board" href="/terms#pro">Terms</a> for refunds.
            </p>
          </section>
        )}
      </div>
    </Page>
  );
}

interface License { email: string; until: string; amount?: number; note?: string }

/** End of the school year that's running now: July 31 of next year from June on, else of this year. */
function schoolYearEnd() {
  const d = new Date();
  return `${d.getFullYear() + (d.getMonth() >= 5 ? 1 : 0)}-07-31`;
}

/** /admin: the administrator records cash payments and turns Pro on or off. Firestore rules enforce who can. */
export function AdminPage() {
  const { isAdmin } = useStore();
  const [list, setList] = useState<License[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!isAdmin) return;
    return onSnapshot(collection(db, 'licenses'), (s) =>
      setList(s.docs.map((d) => ({ email: d.id, ...(d.data() as Omit<License, 'email'>) })).sort((a, b) => a.email.localeCompare(b.email))));
  }, [isAdmin]);
  if (!isAdmin) return <Page title="Admin"><Empty>Only the administrator account can open this page.</Empty></Page>;

  async function activate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; // React clears currentTarget after an await
    const f = new FormData(form);
    const email = String(f.get('email')).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setMsg('Enter a valid email.');
    try {
      await setDoc(doc(db, 'licenses', email), {
        until: String(f.get('until')), amount: Number(f.get('amount')) || 0, note: String(f.get('note')).trim(), activatedAt: serverTimestamp(),
      });
      setMsg(`Pro activated for ${email}.`);
      form.reset();
    } catch (err) { setMsg(`Couldn't save: ${(err as Error).message}`); }
  }

  async function revoke(email: string) {
    if (!confirm(`Turn off Pro for ${email}?`)) return;
    await deleteDoc(doc(db, 'licenses', email));
  }

  const now = today();
  return (
    <Page title="Admin" hint="Record a cash payment to turn on Pro. Teachers' class records are never visible here.">
      <form onSubmit={activate} className="section grid max-w-4xl gap-4 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="label">Teacher's Google email</span><input name="email" type="email" required className="field" placeholder="teacher@gmail.com" /></label>
        <label><span className="label">Pro until</span><input name="until" type="date" required className="field" defaultValue={schoolYearEnd()} /></label>
        <label><span className="label">Amount received (₱)</span><input name="amount" type="number" min={0} className="field" defaultValue={249} /></label>
        <label className="sm:col-span-2"><span className="label">Note (receipt no., school)</span><input name="note" maxLength={200} className="field" /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn-primary">Activate Pro</button>
          <span aria-live="polite" className="text-sm font-bold text-board-dark">{msg}</span>
        </div>
      </form>

      <section className="section mt-6 max-w-4xl">
        <div className="section-head"><h2 className="font-bold">Licenses ({list.length})</h2></div>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((l) => (
              <li key={l.email} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{l.email}</p>
                  <p className="text-sm text-muted">
                    {l.until >= now ? 'Active' : 'Ended'} · until {fmt(l.until)}{l.amount ? ` · ₱${l.amount}` : ''}{l.note ? ` · ${l.note}` : ''}
                  </p>
                </div>
                <button className="btn-ghost" onClick={() => revoke(l.email)}>Turn off</button>
              </li>
            ))}
          </ul>
        ) : <div className="p-5"><Empty>No licenses yet.</Empty></div>}
      </section>
    </Page>
  );
}
