import { useState } from 'react';
import { useStore } from '../store';
import { TERMS } from '../types';
import type { Term } from '../types';
import { Choice, Empty, LearnerPicker, Page } from '../ui';

const termOptions = TERMS.map((t) => ({ value: t, label: `Term ${t}` }));

export default function NotesPage() {
  const { info, learners, setField } = useStore();
  const [id, setId] = useState('');
  const [term, setTerm] = useState<Term>('1');
  const idx = Math.max(0, learners.findIndex((x) => x.id === id));
  const l = learners[idx];

  return (
    <Page title="Notes & attendance" hint="Comments for the report card and days present, per term. Changes save when you leave a field.">
      {!l ? <Empty>Add learners on the Class page first.</Empty> : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LearnerPicker learners={learners} index={idx} onChange={setId} />
            <Choice label="Term" value={term} options={termOptions} onChange={setTerm} />
          </div>

          <div key={`${l.id}-${term}`} className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <section className="section space-y-5 p-5">
              {([['can', 'What your child can do', 'Mga Nagagawa'], ['improve', 'What your child is learning to improve', 'Dapat Linangin']] as const).map(([k, en, fil]) => (
                <label key={k} className="block">
                  <span className="label">{en} <span className="font-normal">({fil})</span></span>
                  <textarea
                    className="field h-auto min-h-32 resize-y leading-relaxed" defaultValue={l.comments[term]?.[k] ?? ''}
                    onBlur={(e) => e.target.value !== (l.comments[term]?.[k] ?? '') && setField(l.id, `comments.${term}.${k}`, e.target.value)}
                  />
                </label>
              ))}
            </section>

            <section className="section">
              <div className="section-head"><h2 className="font-bold">Days present</h2></div>
              <div className="divide-y divide-line">
                {info.months.map((m, i) => m.term === term && (
                  <label key={i} className="flex items-center justify-between gap-3 px-5 py-2">
                    <span>{m.name}</span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <input
                        className="field h-8 w-16 text-right" type="number" min={0} max={m.days}
                        defaultValue={l.attendance[i] ?? 0}
                        onBlur={(e) => {
                          const days = Math.min(m.days, Math.max(0, Number(e.target.value) || 0));
                          e.target.value = String(days);
                          if (days !== (l.attendance[i] ?? 0)) setField(l.id, 'attendance', info.months.map((_, j) => (j === i ? days : l.attendance[j] ?? 0)));
                        }}
                      />
                      of {m.days}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </Page>
  );
}
