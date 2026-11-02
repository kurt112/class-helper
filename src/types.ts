import data from './data/competencies.json';

export type Term = '1' | '2' | '3';
export type Letter = 'A' | 'B' | 'C' | 'D' | 'E';
export const TERMS: Term[] = ['1', '2', '3'];
export const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E'];
/** DepEd descriptors for the rating levels, as on the PACE and SF9 forms */
export const LEVELS: [Letter, string][] = [
  ['A', 'Advancing (Namumukod-tangi)'], ['B', 'Benchmarking (Naipamamalas)'], ['C', 'Connecting (Natutungo)'],
  ['D', 'Developing (Nagpapaunlad)'], ['E', 'Emerging (Nagsisimula)'],
];

export interface Item {
  id: string;
  strand: string;
  no: string;
  text: string;
  parent: string;
  skill: 'L' | 'S' | 'R' | 'W' | null;
  /** term -> [sheet name, VLOOKUP column] in the original workbook, used by the importer */
  src: Partial<Record<Term, [string, number]>>;
}
export interface Subject { id: string; name: string; items: Item[] }

export const SUBJECTS = data.subjects as Subject[];
export const SKILLS = data.skills as Record<string, string>;
export const SKILL_COLORS: Record<string, string> = { L: '#ffe598', S: '#c9a6e6', R: '#f7b083', W: '#c4e0b3' };

export interface Month { name: string; term: Term; days: number }

export interface ClassInfo {
  region: string;
  division: string;
  city: string;
  district: string;
  schoolId: string;
  schoolName: string;
  schoolYear: string;
  schoolHead: string;
  adviser: string;
  gradeLevel: string;
  section: string;
  /** ISO dates used for "age at beginning / end of SY" */
  syStart: string;
  syEnd: string;
  /** Kept for records (a past school year): listed apart from the current classes */
  archived?: boolean;
  months: Month[];
}

export interface Learner {
  id: string;
  name: string;
  lrn: string;
  sex: 'M' | 'F';
  birthdate: string;
  /** key: `${itemId}_${term}` */
  ratings: Record<string, Letter>;
  comments: Partial<Record<Term, { can?: string; improve?: string }>>;
  /** days present, same index as ClassInfo.months */
  attendance: number[];
}

/** Document id: the LRN, or sex + name for learners without one. */
export const learnerId = (sex: Learner['sex'], name: string, lrn: string) => lrn || `${sex}-${name}`.replace(/[^\w-]/g, '_');

export const ratingKey = (itemId: string, term: Term) => `${itemId}_${term}`;

export const DEFAULT_INFO: ClassInfo = {
  region: '', division: '', city: '', district: '', schoolId: '', schoolName: '',
  schoolYear: '2026-2027', schoolHead: '', adviser: '', gradeLevel: '1', section: '',
  syStart: '2026-06-08', syEnd: '2027-04-08',
  months: [
    ['June', '1', 16], ['July', '1', 23], ['August', '1', 19], ['September', '1', 11],
    ['September', '2', 11], ['October', '2', 22], ['November', '2', 19], ['December', '2', 13],
    ['January', '3', 20], ['February', '3', 20], ['March', '3', 21], ['April', '3', 6],
  ].map(([name, term, days]) => ({ name, term, days }) as Month),
};
