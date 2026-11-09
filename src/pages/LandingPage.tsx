import rate from '../assets/guide/rate.jpg';
import randomFill from '../assets/guide/random-fill.jpg';
import forms from '../assets/guide/forms.jpg';

// Desktop installers are attached to the latest GitHub release (built from desktop/).
const RELEASES = 'https://github.com/kurt112/class-helper/releases/latest/download';
const DOWNLOADS = {
  mac: { label: 'Download for Mac', file: `${RELEASES}/Elementary-Class-Record-mac.dmg`, note: 'macOS 11 or later, Apple silicon and Intel' },
  win: { label: 'Download for Windows', file: `${RELEASES}/Elementary-Class-Record-Setup.exe`, note: 'Windows 10 or later, 64-bit' },
};
const os: keyof typeof DOWNLOADS = /Mac/i.test(navigator.userAgent) ? 'mac' : 'win';

const pencil = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4M13.5 6.5l4 4" />
  </svg>
);

const FEATURES = [
  ['Rate A to E in minutes', 'Every Grade 1 competency per subject, term and strand. One tap per learner, or the whole class at once.'],
  ['Random fill to a target', 'Fill unrated competencies so a learner’s average lands on the letter you choose. Undo anytime.'],
  ['Official DepEd workbook', 'Export the filled ECR, PACE and SF9 Excel file, formatting kept, or a zip of all your classes.'],
  ['Import from Excel', 'Download the template, list boys and girls, drop the file in. Numbers and CSV work too.'],
  ['Works offline', 'Keep rating on weak school wifi. Changes sync when you’re back online.'],
  ['Private to you', 'Each teacher sees only their own classes. Stored in Singapore, no ads, no tracking.'],
];

const link = 'font-bold text-board underline-offset-2 hover:underline';

function Download({ which, primary }: { which: keyof typeof DOWNLOADS; primary?: boolean }) {
  return (
    <a href={DOWNLOADS[which].file} className={`${primary ? 'btn-primary' : 'btn-ghost'} h-11 px-5 text-[15px]`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      {DOWNLOADS[which].label}
    </a>
  );
}

/** Public home page for signed-out visitors: what the app does, open it on the web, or install the desktop app. */
export default function LandingPage() {
  const other = os === 'mac' ? 'win' : 'mac';
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-3 font-bold">
          <span className="grid size-9 place-items-center rounded-lg bg-board text-on-board">{pencil}</span>
          Elementary Class Record
        </a>
        <nav className="flex items-center gap-5 text-sm">
          <a className={`${link} hidden sm:inline`} href="/guide">Guide</a>
          <a className={`${link} hidden sm:inline`} href="#desktop">Desktop app</a>
          <a className="btn-ghost" href="/class">Sign in</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 text-center sm:px-8 sm:pt-16">
          <p className="text-sm font-bold tracking-wide text-board uppercase">For Grade 1 teachers in the Philippines</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Your ECR, PACE and SF9, done in one place
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted text-pretty">
            Rate learners, write report-card notes and export the official DepEd workbook. Free, and it works even without internet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/class" className="btn-primary h-11 px-5 text-[15px]">Open the web app</a>
            <Download which={os} />
            <Download which={other} />
          </div>
          <img src={rate} alt="Rating learners A to E for each competency" className="mx-auto mt-12 w-full max-w-5xl rounded-xl border border-line shadow-lg" />
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-4 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
            {FEATURES.map(([title, text]) => (
              <div key={title}>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1.5 text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reach the average you planned</h2>
            <p className="mt-3 text-muted">
              Pick a learner and a target letter. Random fill rates the blanks so the term average comes out right, and you
              review every rating before printing.
            </p>
          </div>
          <img src={randomFill} alt="Random fill with a target average" loading="lazy" className="rounded-xl border border-line shadow-md" />
          <div className="lg:order-4">
            <h2 className="text-2xl font-bold tracking-tight">Print or export when you’re done</h2>
            <p className="mt-3 text-muted">
              SF9 report cards and the PACE form print straight from the app. The Excel export fills the official workbook, so
              it’s ready to submit.
            </p>
          </div>
          <img src={forms} alt="Forms page with print and Excel export" loading="lazy" className="rounded-xl border border-line shadow-md lg:order-3" />
        </section>

        <section id="desktop" className="scroll-mt-6 border-t border-line bg-card">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight">Install on your computer</h2>
            <p className="mt-3 text-muted">
              The desktop app opens in its own window from your dock or Start menu. Sign in once with Google, and it keeps working offline.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Download which={os} primary />
              <Download which={other} />
            </div>
            <p className="mt-3 text-[13px] text-muted">{DOWNLOADS.mac.note} · {DOWNLOADS.win.note}</p>
            <div className="mt-8 grid gap-4 text-left text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-line p-4">
                <p className="font-bold">Mac</p>
                <p className="mt-1 text-muted">
                  Open the .dmg and drag the app to Applications. The first time, right-click the app, choose <b>Open</b>, then <b>Open</b> again.
                </p>
              </div>
              <div className="rounded-lg border border-line p-4">
                <p className="font-bold">Windows</p>
                <p className="mt-1 text-muted">
                  Run the installer. If Windows shows “Windows protected your PC”, click <b>More info</b>, then <b>Run anyway</b>.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-muted">
              Prefer not to install anything? <a className={link} href="/class">Use it in your browser</a>. It works the same.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-8">
        <p>Free for every teacher, supported by donations. Not an official DepEd system.</p>
        <nav className="flex gap-5">
          <a className={link} href="/guide">Guide</a>
          <a className={link} href="/terms">Terms</a>
          <a className={link} href="/privacy">Privacy</a>
          <a className={link} href="/support">Donate</a>
          <a className={link} href="mailto:designscribe.solution@gmail.com">Contact</a>
        </nav>
      </footer>
    </div>
  );
}
