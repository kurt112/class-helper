import { BrowserRouter, NavLink, Redirect, Route, Switch } from 'react-router-dom';
import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AUTH_DISABLED, classLabel, useStore } from './store';
import ClassPage from './pages/ClassPage';
import RatePage from './pages/RatePage';
import NotesPage from './pages/NotesPage';
import PrintMenu from './pages/PrintMenu';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import LegalPage from './pages/LegalPage';
import './app.css';

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
    <path d={d} />
  </svg>
);
const TABS = [
  { to: '/class', label: 'Class', icon: icon('M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8') },
  { to: '/import', label: 'Import', icon: icon('M12 15V3M7 8l5-5 5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4') },
  { to: '/rate', label: 'Rate', icon: icon('M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4M13.5 6.5l4 4') },
  { to: '/notes', label: 'Notes', icon: icon('M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12') },
  { to: '/forms', label: 'Forms', icon: icon('M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z') },
  { to: '/settings', label: 'Settings', icon: icon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1') },
];

function SignIn() {
  const [error, setError] = useState('');
  async function go() {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      setError(code === 'auth/network-request-failed'
        ? 'You’re offline. Connect to the internet once to sign in; after that the app works offline.'
        : `Couldn't sign in (${code ?? (e as Error).message}). Try again.`);
    }
  }
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 grid size-12 place-items-center rounded-xl bg-board text-on-board">{icon('M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4M13.5 6.5l4 4')}</div>
        <h1 className="text-3xl font-bold tracking-tight">Elementary Class Record</h1>
        <p className="mt-2 text-muted">ECR, PACE and SF9 for your class in one place. Works offline once you've signed in.</p>
        <button className="btn-primary mt-8 h-11 w-full text-base" onClick={go}>Sign in with Google</button>
        <p className="mt-4 text-[13px] text-muted">
          By signing in you agree to the <a className="font-bold text-board underline-offset-2 hover:underline" href="/terms">Terms and Conditions</a> and
          acknowledge the <a className="font-bold text-board underline-offset-2 hover:underline" href="/privacy">Data Privacy Notice</a>.
        </p>
        <p aria-live="polite" className="mt-4 text-sm font-bold text-danger">{error}</p>
      </div>
    </main>
  );
}

/** Which class you're working on; "+ New class" adds one. */
function ClassSwitcher() {
  const { classes, classId, selectClass, createClass } = useStore();
  return (
    <select
      aria-label="Class" className="field font-bold" value={classId ?? ''}
      onChange={(e) => (e.target.value === '+new' ? void createClass() : selectClass(e.target.value))}
    >
      {classes.filter((c) => !c.info.archived).map((c) => <option key={c.id} value={c.id}>{classLabel(c.info)}</option>)}
      <option value="+new">+ New class</option>
      {classes.some((c) => c.info.archived) && (
        <optgroup label="Archived">
          {classes.filter((c) => c.info.archived).map((c) => <option key={c.id} value={c.id}>{classLabel(c.info)}</option>)}
        </optgroup>
      )}
    </select>
  );
}

export default function App() {
  const { user } = useStore();
  // Terms and privacy can be read before signing in.
  const legal = location.pathname.match(/^\/(terms|privacy)\/?$/)?.[1] as 'terms' | 'privacy' | undefined;
  if (legal) return <LegalPage doc={legal} />;
  if (user === undefined) return <main className="grid min-h-dvh place-items-center text-muted">Loading…</main>;
  if (!user && !AUTH_DISABLED) return <SignIn />;
  return (
    <BrowserRouter>
      <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:h-dvh md:border-t-0 md:border-r md:pb-0">
          <div className="hidden px-5 pt-6 pb-6 md:block">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-board text-on-board">{icon('M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4M13.5 6.5l4 4')}</span>
              <p className="text-sm leading-tight font-bold">Elementary Class Record</p>
            </div>
            <div className="mt-4"><ClassSwitcher /></div>
          </div>
          {user && <div className="hidden md:absolute md:inset-x-0 md:bottom-0 md:block md:border-t md:border-line md:p-4">
            <p className="truncate text-[13px] font-bold">{user.displayName ?? 'Teacher'}</p>
            <p className="truncate text-[13px] text-muted">{user.email}</p>
            <button className="btn-ghost mt-3 w-full" onClick={() => signOut(auth)}>Sign out</button>
          </div>}
          <ul className="grid grid-cols-6 md:block md:space-y-1 md:px-3">
            {TABS.map((t) => (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  className="flex flex-col items-center gap-0.5 py-2 text-xs font-bold text-muted hover:text-ink md:h-9 md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-0 md:text-sm"
                  activeClassName="!text-board md:bg-board-soft"
                >
                  {t.icon}{t.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0">
          {/* phones have no sidebar: the class switcher sits on top */}
          <div className="sticky top-0 z-10 border-b border-line bg-card px-4 py-2 md:hidden"><ClassSwitcher /></div>
          <Switch>
            <Route exact path="/class" component={ClassPage} />
            <Route exact path="/import" component={ImportPage} />
            <Route exact path="/rate" component={RatePage} />
            <Route exact path="/notes" component={NotesPage} />
            <Route exact path="/forms" component={PrintMenu} />
            <Route exact path="/settings" component={SettingsPage} />
            <Redirect to="/class" />
          </Switch>
        </main>
      </div>
    </BrowserRouter>
  );
}
