import { useState } from 'react';
import { useStore } from '../store';
import { mean, meanLetter, randomFill } from '../lib/randomFill';
import { LETTERS, LEVELS, SKILLS, SKILL_COLORS, SUBJECTS, TERMS, ratingKey } from '../types';
import type { Item, Letter, Term } from '../types';
import { Choice, Empty, LearnerPicker, Page } from '../ui';

export const itemLabel = (it: Item) => `${it.no}${it.text.match(/^([a-z])\./)?.[1] ?? ''}`;
export const itemTitle = (it: Item) => [it.parent, it.text, it.skill && `(${SKILLS[it.skill]})`].filter(Boolean).join(' ');

const termOptions = TERMS.map((t) => ({ value: t, label: `Term ${t}` }));
// Skill colours are pastel in both themes, so text on them stays dark.
const skillStyle = (it: Item) => (it.skill ? { background: SKILL_COLORS[it.skill], color: '#1d2a27' } : undefined);
const cell = 'h-8 w-10 cursor-pointer appearance-none rounded-md border text-center text-sm font-bold focus:border-board focus:outline-none focus:ring-2 focus:ring-board/30';

export default function RatePage() {
  const { learners, setField, setRatings } = useStore();
  const [subjectId, setSubjectId] = useState(SUBJECTS[0].id);
  const [term, setTerm] = useState<Term>('1');
  const [strand, setStrand] = useState<string | null>(null); // null = not picked; '' is a real (unnamed) strand
  const [learnerId, setLearnerId] = useState('');
  const idx = Math.max(0, learners.findIndex((x) => x.id === learnerId));
  const l = learners[idx];
  const [fillOpen, setFillOpen] = useState(false);
  const [target, setTarget] = useState<Letter>('B');
  // The last fill, so it can be undone: which learners got which rating keys.
  // The last fill, so it can be undone: each learner's ratings before it ('' = was blank).
  const [filled, setFilled] = useState<{ label: string; entries: { id: string; before: Record<string, string> }[] } | null>(null);

  // Every competency of every subject in this term: the scope of the learner's term average.
  const termKeys = SUBJECTS.flatMap((s) => s.items.filter((i) => i.src[term]).map((i) => ratingKey(i.id, term)));
  const termRated = l ? termKeys.map((k) => l.ratings[k]).filter(Boolean) : [];

  // Learners with at least one blank competency this term.
  const withBlanks = learners.filter((x) => termKeys.some((k) => !x.ratings[k]));

  // Writes are not awaited: Firestore shows them at once and syncs later, so this also works offline.
  function fill() {
    const blanks = termKeys.filter((k) => !l.ratings[k]);
    const letters = randomFill(termRated, blanks.length, target);
    void setRatings(l.id, Object.fromEntries(blanks.map((k, i) => [k, letters[i]])));
    setFilled({ label: l.name, entries: [{ id: l.id, before: Object.fromEntries(blanks.map((k) => [k, ''])) }] });
  }
  // Already rated: replace all this term's ratings with new random ones averaging the clicked target.
  function rerate() {
    if (!confirm(`Replace all ${termRated.length} Term ${term} ratings of ${l.name} with new random ratings averaging ${target}? You can undo it.`)) return;
    const letters = randomFill([], termKeys.length, target);
    void setRatings(l.id, Object.fromEntries(termKeys.map((k, i) => [k, letters[i]])));
    setFilled({ label: `${l.name} (re-rated to ${target})`, entries: [{ id: l.id, before: Object.fromEntries(termKeys.map((k) => [k, l.ratings[k] ?? ''])) }] });
  }
  // Ticked learners in the grid: re-rate them all at once to the target average.
  const [ticked, setTicked] = useState<string[]>([]);
  const tickedLearners = learners.filter((x) => ticked.includes(x.id));
  const tick = (id: string, on: boolean) => setTicked((t) => (on ? [...t, id] : t.filter((x) => x !== id)));
  function rerateTicked() {
    const n = tickedLearners.length;
    if (!confirm(`Replace the Term ${term} ratings of ${n} ticked learner${n === 1 ? '' : 's'} with new random ratings averaging ${target}? You can undo it.`)) return;
    const entries = tickedLearners.map((x) => {
      const letters = randomFill([], termKeys.length, target); // each learner gets their own random mix
      void setRatings(x.id, Object.fromEntries(termKeys.map((k, i) => [k, letters[i]])));
      return { id: x.id, before: Object.fromEntries(termKeys.map((k) => [k, x.ratings[k] ?? ''])) };
    });
    setFilled({ label: `${n} learner${n === 1 ? '' : 's'} (re-rated to ${target})`, entries });
    setTicked([]);
  }
  function fillClass() {
    const n = withBlanks.length;
    if (!confirm(`Fill the blank Term ${term} ratings of ${n} learner${n === 1 ? '' : 's'} so each averages ${target}? Ratings already entered are kept.`)) return;
    const entries = withBlanks.map((x) => {
      const rated = termKeys.map((k) => x.ratings[k]).filter(Boolean);
      const blanks = termKeys.filter((k) => !x.ratings[k]);
      const letters = randomFill(rated, blanks.length, target); // fresh random letters per learner
      void setRatings(x.id, Object.fromEntries(blanks.map((k, i) => [k, letters[i]])));
      return { id: x.id, before: Object.fromEntries(blanks.map((k) => [k, ''])) };
    });
    setFilled({ label: `${n} learner${n === 1 ? '' : 's'}`, entries });
  }
  function undo() {
    for (const e of filled?.entries ?? []) void setRatings(e.id, e.before);
    setFilled(null);
  }

  const subject = SUBJECTS.find((s) => s.id === subjectId)!;
  const termItems = subject.items.filter((i) => i.src[term]);
  const strands = [...new Set(termItems.map((i) => i.strand))];
  const shownStrand = strand !== null && strands.includes(strand) ? strand : strands[0];
  const items = termItems.filter((i) => i.strand === shownStrand);

  const setAll = (it: Item, v: string) => learners.forEach((l) => setField(l.id, `ratings.${ratingKey(it.id, term)}`, v));

  return (
    <Page
      title="Rate" hint="Pick A–E for each learner and competency."
      actions={learners.length > 0 && <button className={fillOpen ? 'btn-primary' : 'btn-ghost'} aria-expanded={fillOpen} onClick={() => setFillOpen(!fillOpen)}>Random fill</button>}
    >
      {fillOpen && l && (
        <section className="section mb-6 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full max-w-md">
              <span className="label">Learner</span>
              <LearnerPicker learners={learners} index={idx} onChange={setLearnerId} />
            </div>
            <div>
              <span className="label">Target average</span>
              <Choice label="Target average" value={target} options={LETTERS.map((x) => ({ value: x, label: x }))} onChange={setTarget} />
            </div>
            <button className="btn-primary" disabled={termRated.length === termKeys.length} onClick={fill}>
              Fill {termKeys.length - termRated.length} blanks
            </button>
            {termRated.length > 0 && (
              <button className="btn-ghost" onClick={rerate} title="Replace this learner's ratings for the term">Re-rate all to {target}</button>
            )}
          </div>
          <ul aria-label="Rating levels" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {LEVELS.map(([k, d]) => (
              <li key={k} className={k === target ? 'font-bold text-board-dark' : 'text-muted'}>
                <b className={`mr-1 inline-grid size-5 place-items-center rounded ${k === target ? 'bg-board text-on-board' : 'bg-board-soft text-ink'}`}>{k}</b>{d}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-muted">
            Gives every unrated competency in Term {term}, across all subjects, a random rating so the term average comes out to {target}.
            Ratings you already entered stay as they are. Re-rate all replaces this learner's Term {term} ratings so the average becomes {target}.
          </p>
          <p aria-live="polite" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>
              <b>{l.name}</b>, Term {term}: {termRated.length} of {termKeys.length} rated
              {termRated.length > 0 && <>, average <b>{meanLetter(termRated)}</b> ({mean(termRated).toFixed(2)})</>}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm">
              <b>Whole class:</b>{' '}
              {withBlanks.length
                ? `${withBlanks.length} of ${learners.length} learners have unrated competencies in Term ${term}.`
                : `every learner is fully rated in Term ${term}.`}
              <span className="block text-[13px] text-muted">Fills each learner's blanks with their own random ratings so each term average comes out to {target}. Ratings already entered are kept.</span>
            </p>
            <button className="btn-primary" disabled={!withBlanks.length} onClick={fillClass}>
              Fill blanks for {withBlanks.length} learner{withBlanks.length === 1 ? '' : 's'}
            </button>
          </div>

          {filled && (
            <p aria-live="polite" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-board-soft px-4 py-2.5 text-sm text-board-dark">
              <span>Filled random ratings for <b>{filled.label}</b>.</span>
              <button className="font-bold underline-offset-2 hover:underline" onClick={undo}>Undo fill</button>
            </p>
          )}
        </section>
      )}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:flex-1"><Choice label="Subject" value={subjectId} options={SUBJECTS.map((s) => ({ value: s.id, label: s.name }))} onChange={setSubjectId} /></div>
        <Choice label="Term" value={term} options={termOptions} onChange={setTerm} />
      </div>
      {strands.length > 1 && (
        <label className="mb-4 flex items-center gap-3">
          <span className="text-sm font-bold text-muted">Strand</span>
          <select className="field max-w-sm" value={shownStrand} onChange={(e) => setStrand(e.target.value)}>
            {strands.map((s) => <option key={s} value={s}>{s || 'Other competencies'}</option>)}
          </select>
        </label>
      )}

      {!learners.length ? (
        <Empty>Add learners on the Class page first.</Empty>
      ) : !items.length ? (
        <Empty>Nothing to rate for {subject.name} in Term {term}.</Empty>
      ) : (
        <>
          {/* Phones: one learner at a time with big tap targets. Laptops get the full grid below. */}
          <div className="md:hidden">
            <LearnerPicker learners={learners} index={idx} onChange={setLearnerId} />
            <ul className="mt-4 space-y-3">
              {items.map((it) => {
                const key = ratingKey(it.id, term);
                const v = l.ratings[key] ?? '';
                return (
                  <li key={it.id} className="section p-3.5">
                    <p className="text-sm leading-relaxed">
                      <b className="mr-2 rounded px-1.5 py-0.5" style={skillStyle(it)}>{itemLabel(it)}{it.skill && ` ${it.skill}`}</b>
                      {itemTitle(it)}
                    </p>
                    <div role="radiogroup" aria-label={itemTitle(it)} className="mt-3 grid grid-cols-5 gap-2">
                      {LETTERS.map((x) => (
                        <button
                          key={x} type="button" role="radio" aria-checked={v === x}
                          onClick={() => setField(l.id, `ratings.${key}`, v === x ? '' : x)}
                          className={`h-10 rounded-lg border text-base font-bold transition-colors ${v === x ? 'border-board bg-board text-on-board' : 'border-line bg-card text-muted active:bg-board-soft'}`}
                        >{x}</button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
            {idx < learners.length - 1 && (
              <button className="btn-primary mt-4 h-11 w-full" onClick={() => { setLearnerId(learners[idx + 1].id); scrollTo({ top: 0 }); }}>
                Next learner: {learners[idx + 1].name}
              </button>
            )}
          </div>

          <div className="hidden md:block">
          <p className="mb-3 text-sm text-muted">Use the top row to set a whole column at once. Tick learners to re-rate them to a new average.</p>
          {(ticked.length > 0 || (filled && !fillOpen)) && (
            <div className="sticky top-0 z-40 mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-board/30 bg-board-soft px-4 py-2.5 text-sm">
              {ticked.length > 0 ? (
                <>
                  <b className="text-board-dark">{ticked.length} ticked</b>
                  <span className="text-muted">Target average</span>
                  <Choice label="Target average for ticked learners" value={target} options={LETTERS.map((x) => ({ value: x, label: x }))} onChange={setTarget} />
                  <span className="text-muted">{LEVELS.find(([k]) => k === target)?.[1]}</span>
                  <button className="btn-primary" onClick={rerateTicked}>Re-rate {ticked.length} to {target}</button>
                  <button className="font-bold text-muted hover:text-ink" onClick={() => setTicked([])}>Clear</button>
                </>
              ) : (
                <>
                  <span className="text-board-dark">Filled random ratings for <b>{filled!.label}</b>.</span>
                  <button className="font-bold text-board-dark underline-offset-2 hover:underline" onClick={undo}>Undo</button>
                </>
              )}
            </div>
          )}
          <div className="section max-h-[70dvh] w-fit max-w-full overflow-auto">
            <table className="border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 border-r border-b border-line bg-card px-4 py-2 text-left font-bold">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox" className="size-4 accent-board" aria-label="Tick all learners"
                        checked={ticked.length === learners.length} ref={(el) => { if (el) el.indeterminate = ticked.length > 0 && ticked.length < learners.length; }}
                        onChange={(e) => setTicked(e.target.checked ? learners.map((x) => x.id) : [])}
                      />
                      Learner
                    </label>
                  </th>
                  {items.map((it) => (
                    <th
                      key={it.id} title={itemTitle(it)}
                      className="sticky top-0 z-20 border-b border-line px-1.5 py-2 text-center font-bold bg-card"
                      style={skillStyle(it)}
                    >
                      <div className="mb-1 whitespace-nowrap">{itemLabel(it)}{it.skill && <span className="ml-1 font-normal opacity-70">{it.skill}</span>}</div>
                      <select aria-label={`Set all: ${itemTitle(it)}`} value="" onChange={(e) => setAll(it, e.target.value)} className={`${cell} border-[#1d2a2733] bg-[#fffc] text-[#1d2a27] text-xs font-normal`}>
                        <option value="">all</option>
                        {LETTERS.map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {learners.map((l) => (
                  <tr key={l.id} className="group">
                    <th className={`sticky left-0 z-10 max-w-[46vw] border-r border-b border-line px-4 py-1.5 text-left font-normal group-hover:bg-board-soft sm:max-w-xs ${ticked.includes(l.id) ? 'bg-board-soft' : 'bg-card'}`}>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="size-4 shrink-0 accent-board" aria-label={`Tick ${l.name}`} checked={ticked.includes(l.id)} onChange={(e) => tick(l.id, e.target.checked)} />
                        <span className="truncate">{l.name}</span>
                      </label>
                    </th>
                    {items.map((it) => {
                      const key = ratingKey(it.id, term);
                      const v = l.ratings[key] ?? '';
                      return (
                        <td key={it.id} className="border-b border-line px-1.5 py-1.5 text-center group-hover:bg-board-soft/60">
                          <select
                            aria-label={`${l.name}: ${itemTitle(it)}`} value={v} onChange={(e) => setField(l.id, `ratings.${key}`, e.target.value)}
                            className={`${cell} ${v ? 'border-board/40 bg-board-soft text-board-dark' : 'border-line bg-card text-muted'}`}
                          >
                            <option value="">–</option>
                            {LETTERS.map((x) => <option key={x}>{x}</option>)}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-4 text-sm" open>
            <summary className="cursor-pointer font-bold text-muted">Competencies in this view</summary>
            <ul className="mt-2 space-y-1.5">
              {items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <b className="w-14 shrink-0 rounded px-1.5 text-center" style={skillStyle(it)}>{itemLabel(it)}{it.skill && ` ${it.skill}`}</b>
                  <span>{itemTitle(it)}</span>
                </li>
              ))}
            </ul>
          </details>
          </div>
        </>
      )}
    </Page>
  );
}
