import { AUTH_DISABLED, useStore } from '../store';
import { ageAt } from '../lib/age';
import { SKILLS, SKILL_COLORS, SUBJECTS, TERMS, ratingKey } from '../types';
import type { ClassInfo, Learner } from '../types';
import '../print.css';

const LEVELS = [
  ['A', 'Advancing (Namumukod-tangi)'], ['B', 'Benchmarking (Naipamamalas)'], ['C', 'Connecting (Natutungo)'],
  ['D', 'Developing (Nagpapaunlad)'], ['E', 'Emerging (Nagsisimula)'],
];
const TERM_NAMES = { 1: 'TERM 1 (UNANG TERMINO)', 2: 'TERM 2 (IKALAWANG TERMINO)', 3: 'TERM 3 (IKATLONG TERMINO)' };

export default function PrintPage() {
  const { user, info, learners, loaded } = useStore();
  const q = new URLSearchParams(location.search);
  const form = q.get('form') === 'pace' ? 'pace' : 'sf9';
  const id = q.get('id') ?? 'all';
  if (user === null && !AUTH_DISABLED) return <p className="print-msg">Sign in first, then open this page again from the Forms tab.</p>;
  if (!loaded) return <p className="print-msg">Loading…</p>;
  const list = id === 'all' ? learners : learners.filter((l) => l.id === id);

  return (
    <div className={`print ${form}`}>
      <div className="no-print toolbar">
        <button onClick={() => window.print()}>Print</button> {list.length} learner(s)
      </div>
      {list.map((l) => (form === 'sf9' ? <Sf9 key={l.id} info={info} l={l} /> : <Pace key={l.id} info={info} l={l} />))}
    </div>
  );
}

function Sf9({ info, l }: { info: ClassInfo; l: Learner }) {
  const start = ageAt(l.birthdate, info.syStart);
  const end = ageAt(l.birthdate, info.syEnd);
  const present = (i: number) => l.attendance[i] ?? 0;
  const total = (f: (i: number) => number) => info.months.reduce((s, _, i) => s + f(i), 0);
  return (
    <section className="page sf9-page">
      <div className="col">
        <header className="center">
          <div>Republic of the Philippines</div>
          <div>Department of Education</div>
          <div>{info.region}</div>
          <div>SCHOOLS DIVISION OFFICE OF {info.division.toUpperCase()}</div>
          <div>{info.district} · {info.city}</div>
          <h2>{info.schoolName}</h2>
          <h3>LEARNER'S PROGRESS REPORT CARD</h3>
          <div>School Year {info.schoolYear}</div>
        </header>
        <table className="kv">
          <tbody>
            <tr><td>Name: <b>{l.name}</b></td><td>LRN: <b>{l.lrn}</b></td></tr>
            <tr><td>Section: <b>{info.section}</b> · Teacher: <b>{info.adviser}</b></td><td>Birthdate: <b>{l.birthdate}</b></td></tr>
            <tr>
              <td>Age (beginning of SY): <b>{start ? `${start.years} yrs ${start.months} mos` : ''}</b></td>
              <td>Age (end of SY): <b>{end ? `${end.years} yrs ${end.months} mos` : ''}</b></td>
            </tr>
          </tbody>
        </table>
        {TERMS.map((t) => (
          <div key={t} className="term">
            <h4>{TERM_NAMES[t]}</h4>
            <p><b>What Your Child Can Do (Mga Nagagawa):</b> {l.comments[t]?.can}</p>
            <p><b>What Your Child Is Learning To Improve (Dapat Linangin):</b> {l.comments[t]?.improve}</p>
            <p className="sign">Parent's/Guardian's Signature: ______________________</p>
          </div>
        ))}
      </div>
      <div className="col">
        <h4 className="center">ATTENDANCE RECORD</h4>
        <table className="lines">
          <thead><tr><th>Term</th><th>Month</th><th>No. of Class Days</th><th>No. Days Present</th><th>No. of Times Absent</th></tr></thead>
          <tbody>
            {info.months.map((m, i) => (
              <tr key={i}><td>{m.term}</td><td>{m.name}</td><td>{m.days}</td><td>{present(i)}</td><td>{m.days - present(i)}</td></tr>
            ))}
            <tr><th colSpan={2}>TOTAL</th><th>{total((i) => info.months[i].days)}</th><th>{total(present)}</th><th>{total((i) => info.months[i].days - present(i))}</th></tr>
          </tbody>
        </table>
        <h4>Performance levels used in monitoring</h4>
        <table className="lines">
          <tbody>{LEVELS.map(([k, d]) => <tr key={k}><th>{k}</th><td>{d}</td></tr>)}</tbody>
        </table>
        <h4 className="center">CERTIFICATE OF TRANSFER</h4>
        <p>This is to certify that the above-named learner has satisfactorily completed the requirements of this grade level.</p>
        <p>Admitted to Grade: {info.gradeLevel} &nbsp; Eligible for Admission to Grade: ________</p>
        <div className="signs">
          <div><b>{info.adviser}</b><br />Adviser</div>
          <div><b>{info.schoolHead}</b><br />School Head</div>
        </div>
        <h4 className="center">CANCELLATION OF ELIGIBILITY TO TRANSFER</h4>
        <p>Admitted in: _____________ Date: __________</p>
        <div className="signs"><div>____________________<br />School Head</div></div>
      </div>
    </section>
  );
}

function Pace({ info, l }: { info: ClassInfo; l: Learner }) {
  return (
    <section className="page pace-page">
      <h3 className="center">PERFORMANCE AND COMPETENCY EVALUATION (PACE) FORM</h3>
      <p>LRN: <b>{l.lrn}</b> &nbsp; Name: <b>{l.name}</b> &nbsp; Section: <b>{info.section}</b></p>
      <p className="skills">
        {Object.entries(SKILLS).map(([k, v]) => <span key={k} style={{ background: SKILL_COLORS[k] }}>{k} – {v}</span>)}
      </p>
      {SUBJECTS.map((s) => (
        <table key={s.id} className="lines pace-table">
          <thead>
            <tr><th colSpan={2}>{s.name.toUpperCase()}</th><th>T1</th><th>T2</th><th>T3</th></tr>
          </thead>
          <tbody>
            {s.items.map((it, i) => {
              const prev = s.items[i - 1];
              const sameText = prev && prev.no === it.no && prev.text === it.text;
              return (
                <tr key={it.id}>
                  <td className="no">{sameText ? '' : it.no}</td>
                  <td>{sameText ? '' : [it.parent, it.text].filter(Boolean).join(' – ')}</td>
                  {TERMS.map((t) => (
                    <td key={t} className="rate" style={{ background: it.src[t] && it.skill ? SKILL_COLORS[it.skill] : it.src[t] ? undefined : '#ddd' }}>
                      {l.ratings[ratingKey(it.id, t)] ?? ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}
    </section>
  );
}
