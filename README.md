# Elementary Class Record (React + TypeScript + Tailwind + Firebase)

Web/mobile version of the Grade 1 ECR / PACE / SF9 workbook.

- **Guide** (`/guide`, menu and sign-in screen): every feature step by step with screenshots from the demo class (`src/assets/guide/`); readable before signing in.
- **Classes**: switch classes from the dropdown at the top of the sidebar (top bar on phones); "+ New class" starts one with the same school details. Each class has its own learners, ratings, notes and attendance. Delete a class on the Class page (you type its section name to confirm). **Archive class** (Class page) moves a past year's class under "Archived" in the menu, kept for records; **Settings → Archive by school year** archives every class of a year at once; once a class's last day of SY has passed the Class page suggests it, and "+ New class" then starts in the next school year.
- **Class**: school info, SY dates (ages are computed from these), class days per month, learners, **Import Excel** (reads the original workbook: learners, all ratings, notes, attendance).
- **Import**: add learners from the downloadable **Excel template** (Male and Female sheets, LRN and birthdate columns pre-set to Text; one upload fills both lists) or from two CSV files, one for male and one for female learners. Columns: whole name (`LASTNAME, FIRSTNAME, MIDDLENAME`), LRN, birthdate (`YYYY-MM-DD` or `MM/DD/YYYY`). Shows a preview with problem rows first; learners already in the class are skipped, never overwritten.
- **Rate**: subject → term → strand grid. One A–E dropdown per learner per competency; the "all…" dropdown in a column header sets everyone at once. Colours = macro skill (L/S/R/W) as on the PACE form. **Random fill** gives one learner random ratings for every blank competency in the term so the term average equals the level you pick (A=5 … E=1); ratings already entered are kept, and **Undo fill** removes them again. **Fill blanks for N learners** does the same for the whole class at once (each learner gets their own random letters).
- **Notes**: "Mga Nagagawa" / "Dapat Linangin" and days present per learner per term.
- **Forms**: printable SF9 (A4 landscape) and PACE for one learner or the whole class.
- **Download all current classes (.zip)** (on Forms, with 2+ classes): one filled workbook per non-archived class, each with its school year's template; classes with no learners are skipped.
- **Export to Excel** (on Forms): downloads the official ECR / PACE / SF9 workbook filled with the class: school info, learners, every rating, notes and attendance. Only input cells are written, so formatting, logos, dropdowns and formulas match the original; Excel recalculates on open. Room for 50 male + 50 female learners.

**Firebase project:** `class-helper-f79f7` (config in `.env.local`, not committed). Teachers sign in with Google; each sees only the classes they own (`firestore.rules`: a class's `owner` is the teacher's uid). Deploy rule changes with `firebase deploy --only firestore:rules --project class-helper-f79f7`. Data lives in Firestore at `classes/{classId}` + `classes/{classId}/learners/{lrn}`.

**Offline:** after the first visit and sign-in (needs internet once), the app opens and works with no connection: a service worker (`src/sw.js`, built by `vite.config.ts`) caches the app and font, and Firestore keeps the class on the device and syncs edits when the connection returns.

**Terms and privacy:** `/terms` and `/privacy` (`src/pages/LegalPage.tsx`), linked from the sign-in screen and Settings and readable
without signing in. Set `CONTACT_EMAIL` at the top of that file before teachers use the app, and update the pages if what the app stores changes.

## Run locally (no Firebase account needed)

```bash
npm install
echo VITE_USE_EMULATORS=1 > .env.local
npm run emulators      # terminal 1 (needs Java)
npm run dev            # terminal 2
```

## Deploy to your Firebase project

1. Create a project at console.firebase.google.com → add a **Web app** → enable **Authentication › Google** and **Firestore**.
2. Copy `.env.example` to `.env.local` and paste the config values (leave `VITE_USE_EMULATORS` empty).
3. `firebase login`, then:

```bash
npm run build
firebase deploy --only hosting,firestore:rules --project <your-project-id>
```

## Updating competencies

`src/data/competencies.json` was generated from the workbook's **PACE - GRADE 1** sheet: every rating cell is one item, with the
original sheet + VLOOKUP column it came from (used by the importer). Edit it by hand if DepEd changes the list.

`npx vite-node scripts/check-import.ts <workbook.xlsx>` prints what the importer reads from a workbook.

## Export template

**Templates setting (Forms page):** upload another version of the workbook, name it, and list the school years it's for
(e.g. `2027-2028`). The export uses the newest template listing the class's school year, otherwise the built-in one.
Uploads are blanked (no learner data kept) and checked: a workbook whose sheets or learner rows don't match is refused,
and PACE formulas that miss a competency are listed as warnings. Templates are stored in the browser (IndexedDB), per device.

`src/assets/ecr-template.xlsx` is the official workbook with every input cell cleared and no learner data left in it
(saved formula results, unused text and author details are stripped too). If DepEd updates the workbook, rebuild it from a filled copy:

```bash
npx vite-node scripts/make-ecr-template.ts path/to/FINAL-UPDATED-Grade-1-ECR-PACE-Form-and-SF9.xlsx
```

`npm test` then checks the export still writes every value to the right cell without changing any formula or format.

**Corrections to the official workbook.** The DepEd file's PACE sheet had formula mistakes that `competencies.json` had inherited:
TERM 3 LANGUAGE has an extra (duplicate) "6b" column pair, so from column AS on it sits two columns to the right of Terms 1–2,
but the PACE Term 3 formulas never shifted; three formulas read the wrong sheet (Term 1, Term 2, or Reading & Literacy instead of Term 3 Language);
and 3c, 13b and 19 Speaking had no formula for some terms. Competency columns are now taken from the class-summary headers and colours,
and the template's PACE formulas were corrected to match (69 formulas). If you rebuild the template from a new DepEd file,
`npm test` (the "template PACE sheet" test) fails until the PACE formulas agree with `competencies.json` again.

## Desktop app (Electron)

`desktop/` wraps the hosted app in a window. Build the installers (run from a normal terminal, not VS Code's, which sets `ELECTRON_RUN_AS_NODE`):

```bash
cd desktop && npm install
npm run dist:mac   # dist/Elementary-Class-Record-mac.dmg
npm run dist:win   # dist/Elementary-Class-Record-Setup.exe
```

Upload both files to a GitHub release on kurt112/class-helper; the landing page links to `releases/latest/download/<file>`.
