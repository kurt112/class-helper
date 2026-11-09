import type { ReactNode } from 'react';
import { Page } from '../ui';
import intro from '../assets/guide/intro.jpg';
import classes from '../assets/guide/classes.jpg';
import classPage from '../assets/guide/class.jpg';
import importPage from '../assets/guide/import.jpg';
import rate from '../assets/guide/rate.jpg';
import randomFill from '../assets/guide/random-fill.jpg';
import rerate from '../assets/guide/rerate.jpg';
import notes from '../assets/guide/notes.jpg';
import forms from '../assets/guide/forms.jpg';
import templates from '../assets/guide/templates.jpg';
import settings from '../assets/guide/settings.jpg';

// Screenshots come from the tutorial recording: a made-up demo class, no real learners.
interface Section { id: string; title: string; image?: string; small?: boolean; alt: string; steps: ReactNode[]; tip?: ReactNode }

const SECTIONS: Section[] = [
  {
    id: 'sign-in', title: 'Sign in', image: intro, alt: 'Sign-in screen with the agreement box ticked',
    steps: [
      <>Tick <b>I have read and agree</b> to the Terms and Conditions and the Data Privacy Notice.</>,
      <>Click <b>Sign in with Google</b> and choose your account.</>,
    ],
    tip: 'Each teacher sees only their own classes. Sign in with your own Google account.',
  },
  {
    id: 'classes', title: 'Your classes', image: classes, small: true, alt: 'The class menu at the top of the sidebar',
    steps: [
      <>Switch classes with the <b>class menu</b> at the top of the sidebar (on a phone, at the top of the screen).</>,
      <>Pick <b>+ New class</b> to add one (more than one active class needs Pro). It copies your school details; once a school year has ended, the new class starts in the next school year.</>,
      <><b>Archive class</b> (Class page) keeps a past class for your records under "Archived" in the menu.</>,
      <><b>Delete class</b> asks you to type the section name first, because it erases everything in that class.</>,
    ],
  },
  {
    id: 'class', title: 'School details and class days', image: classPage, alt: 'Class page with learners and the School card',
    steps: [
      <>On <b>Class</b>, fill in the <b>School</b> card: school name, region, division, adviser, section and school year.</>,
      <>Set the <b>class days per month</b>; the SF9 attendance table uses them.</>,
      <>Add a learner by hand with the form at the top of the learner list.</>,
    ],
    tip: 'Everything saves automatically when you leave a field. There is no save button.',
  },
  {
    id: 'import', title: 'Add learners from Excel', image: importPage, alt: 'Import page with Male and Female upload boxes',
    steps: [
      <>On <b>Import</b>, click <b>Download Excel template</b>.</>,
      <>Put boys on the <b>Male</b> sheet and girls on the <b>Female</b> sheet: whole name (LASTNAME, FIRSTNAME, MIDDLENAME), LRN, birthdate.</>,
      <>Drop the filled file into either box. Both sheets load at once. Excel, Numbers and CSV files work.</>,
      <>Check the <b>preview</b>, then click <b>Add learners</b>. Learners already in the class are skipped, never overwritten.</>,
    ],
    tip: <>Already have a filled DepEd ECR workbook? Use <b>Import Excel</b> on the Class page to load everything from it, ratings included. It replaces the class.</>,
  },
  {
    id: 'rate', title: 'Rate learners', image: rate, alt: 'Rating grid with A to E for each learner and competency',
    steps: [
      <>On <b>Rate</b>, choose the <b>subject</b>, <b>term</b> and <b>strand</b>.</>,
      <>Pick <b>A to E</b> for each learner and competency. The <b>all</b> box at the top of a column rates the whole class at once.</>,
      <>Column colours show the skill: Listening, Speaking, Reading, Writing. Black cells are not assessed in that term.</>,
    ],
    tip: 'On a phone, Rate shows one learner at a time with big A to E buttons.',
  },
  {
    id: 'random-fill', title: 'Random fill and re-rate', image: randomFill, alt: 'Random fill panel with target average and legend',
    steps: [
      <>Click <b>Random fill</b>, pick a learner and a <b>target average</b>. The legend shows what A to E mean.</>,
      <><b>Fill blanks</b> gives every unrated competency a rating so the term average comes out to the target. Ratings you entered stay.</>,
      <><b>Fill blanks for N learners</b> does the same for the whole class.</>,
      <><b>Re-rate all to</b> a letter replaces that learner's ratings for the term to reach a new average.</>,
      <><b>Undo fill</b> puts back exactly what was there before.</>,
    ],
    tip: 'Random fill and Re-rate are Pro features. You are responsible for every rating: review filled ratings before printing.',
  },
  {
    id: 'tick', title: 'Re-rate several learners', image: rerate, alt: 'Ticked learners and the Re-rate bar above the grid',
    steps: [
      <>Tick the box beside each learner in the grid, or the box beside <b>Learner</b> to tick everyone.</>,
      <>In the bar that appears, pick the target letter and click <b>Re-rate N to</b> that letter.</>,
      <>Changed your mind? Click <b>Undo</b> in the same bar.</>,
    ],
  },
  {
    id: 'notes', title: 'Notes and attendance', image: notes, alt: 'Notes page with comments and days present',
    steps: [
      <>On <b>Notes</b>, pick the learner (use ‹ › to step through) and the term.</>,
      <>Write <b>What your child can do</b> and <b>What your child is learning to improve</b>.</>,
      <>Enter the <b>days present</b> for each month.</>,
    ],
    tip: 'These fill the comments and attendance on the SF9 report card.',
  },
  {
    id: 'forms', title: 'Print and export', image: forms, alt: 'Forms page with print cards and Export to Excel',
    steps: [
      <>On <b>Forms</b>, open the <b>SF9</b> or <b>PACE</b> print view for one learner or the whole class.</>,
      <><b>Download Excel workbook</b> gives the official ECR, PACE and SF9 file, filled in. On its SF9 and PACE sheets, pick a learner in the Name cell.</>,
      <><b>Download all current classes</b> puts a workbook for every class in one zip file.</>,
    ],
    tip: 'The Term progress bars show how much is rated. Unrated competencies are left blank.',
  },
  {
    id: 'templates', title: 'New DepEd form versions', image: templates, alt: 'Templates card on the Forms page',
    steps: [
      <>Under <b>Templates</b> on the Forms page, choose the new Excel workbook, name it, and type the school years it is for.</>,
      <>Click <b>Add template</b>. Learner data in the file is removed; only the form is kept.</>,
      <>Exports for those school years now use it. Other years use the built-in form.</>,
    ],
    tip: 'Templates are saved in this browser, so add them again on another computer.',
  },
  {
    id: 'school-year', title: 'End of the school year', image: settings, alt: 'Settings page with Archive by school year',
    steps: [
      <>In <b>Settings</b>, find the finished school year and click <b>Archive all</b>.</>,
      <>The classes move under "Archived" in the class menu, with all their records. Open one and click <b>Restore class</b> to bring it back.</>,
      <>Start the new year with <b>+ New class</b>.</>,
    ],
  },
];

export default function GuidePage() {
  return (
    <Page title="Guide" hint="How to use every feature, step by step.">
      <nav aria-label="Guide contents" className="mb-8 flex max-w-4xl flex-wrap gap-2">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-card px-3 py-1 text-[13px] font-bold text-muted hover:border-board hover:text-board">
            {i + 1}. {s.title}
          </a>
        ))}
      </nav>

      <div className="max-w-4xl space-y-6">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="section scroll-mt-6 p-5 sm:p-6">
            <h2 className="flex items-center gap-3 text-xl font-bold">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-board text-sm text-on-board">{i + 1}</span>
              {s.title}
            </h2>
            <div className={`mt-4 grid gap-5 ${s.small ? 'sm:grid-cols-[1fr_15rem]' : ''}`}>
              {s.image && (
                <img
                  src={s.image} alt={s.alt} loading="lazy"
                  className={`rounded-lg border border-line ${s.small ? 'sm:order-2 sm:w-60' : 'w-full'}`}
                />
              )}
              <div>
                <ol className="list-decimal space-y-2 pl-5 leading-relaxed">{s.steps.map((step, j) => <li key={j}>{step}</li>)}</ol>
                {s.tip && <p className="mt-4 rounded-lg bg-board-soft px-4 py-2.5 text-sm text-board-dark">{s.tip}</p>}
              </div>
            </div>
          </section>
        ))}

        <section className="section p-5 sm:p-6">
          <h2 className="text-xl font-bold">Good to know</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
            <li>Works offline: changes made without internet are saved on the device and sync when you reconnect.</li>
            <li>Only you can see your classes. Sign out on shared computers.</li>
            <li>
              Read the <a className="font-bold text-board underline-offset-2 hover:underline" href="/terms">Terms and Conditions</a> and the{' '}
              <a className="font-bold text-board underline-offset-2 hover:underline" href="/privacy">Data Privacy Notice</a>.
            </li>
          </ul>
        </section>
      </div>
    </Page>
  );
}
