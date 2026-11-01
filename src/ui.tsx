import type { ReactNode } from 'react';

/** Page shell: title row with optional actions, then content. */
export function Page({ title, hint, actions, children }: { title: string; hint?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-8 md:pb-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

/** Pill-style single choice, used for subject and term pickers. */
export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-xl bg-board-soft p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-lg px-3 py-1 text-[13px] font-bold whitespace-nowrap transition-colors ${
            o.value === value ? 'bg-card text-board shadow-xs' : 'text-muted hover:text-ink'}`}
        >{o.label}</button>
      ))}
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center text-muted">{children}</p>
);

/** Learner dropdown with previous / next buttons; `index` is the shown learner. */
export function LearnerPicker({ learners, index, onChange }: { learners: { id: string; name: string }[]; index: number; onChange: (id: string) => void }) {
  return (
    <div className="flex w-full max-w-md min-w-0 items-center gap-1.5">
      <button className="btn-ghost w-9 shrink-0 px-0" aria-label="Previous learner" disabled={index === 0} onClick={() => onChange(learners[index - 1].id)}>‹</button>
      <select aria-label="Learner" className="field font-bold" value={learners[index].id} onChange={(e) => onChange(e.target.value)}>
        {learners.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <button className="btn-ghost w-9 shrink-0 px-0" aria-label="Next learner" disabled={index === learners.length - 1} onClick={() => onChange(learners[index + 1].id)}>›</button>
    </div>
  );
}
