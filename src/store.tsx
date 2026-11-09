import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { collection, deleteDoc, deleteField, doc, getDocs, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { DEFAULT_INFO } from './types';
import { nextClassInfo } from './lib/schoolYear';
import type { ClassInfo, Learner } from './types';

export interface ClassSummary { id: string; info: ClassInfo }

interface Store {
  user: User | null | undefined; // undefined = still checking
  /** Paid Pro plan active (licenses/{email} set by the admin, not past its end date). */
  pro: boolean;
  /** Pro ends on this date (YYYY-MM-DD), if a license exists */
  proUntil: string | undefined;
  /** The admin account, which activates Pro for teachers who paid */
  isAdmin: boolean;
  /** Every class this teacher has, and the one being worked on */
  classes: ClassSummary[];
  classId: string | undefined;
  selectClass(id: string): void;
  /** New class with the current class's school details (not its section or learners), moved to the next
   *  school year if this one has ended; returns its id */
  createClass(): Promise<string>;
  /** The learners of any class (not just the open one), sorted like the class list */
  classLearners(id: string): Promise<Learner[]>;
  /** Archives every class of a school year at once */
  archiveYear(schoolYear: string): Promise<void>;
  /** Deletes a class with all its learners, ratings, notes and attendance */
  deleteClass(id: string): Promise<void>;
  info: ClassInfo;
  learners: Learner[];
  loaded: boolean;
  saveInfo(patch: Partial<ClassInfo>): Promise<void>;
  /** path is a dotted field path, e.g. `ratings.RL-19L_1`; empty value deletes the field */
  setField(id: string, path: string, value: unknown): Promise<void>;
  /** Several ratings for one learner in a single write; '' deletes that rating. Keys from ratingKey(). */
  setRatings(id: string, ratings: Record<string, string>): Promise<void>;
  addLearner(l: Learner): Promise<void>;
  /** Adds many learners in one write. */
  addLearners(list: Learner[]): Promise<void>;
  removeLearner(id: string): Promise<void>;
  replaceAll(info: ClassInfo, learners: Learner[]): Promise<void>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => useContext(Ctx)!;

// Google sign-in is required: each teacher sees only the classes they own (see firestore.rules).
// Set to true only for local testing: every class is then open to anyone with the app, and firestore.rules
// needs its open block back.
export const AUTH_DISABLED = false;

/** Activates Pro for teachers; must match isAdmin() in firestore.rules. */
export const ADMIN_EMAIL = 'designscribe.solution@gmail.com';
export const PRO_PRICE = '₱249';
/** Off = every feature is free for everyone (donations instead). Turn on to bring back the paid Pro plan. */
export const PRO_ENABLED = false;
/** Today as YYYY-MM-DD in local time, to compare with license end dates. */
export const today = () => new Date().toLocaleDateString('en-CA');

/** Short name for the class switcher, e.g. "ROSE (2026-27)". */
export const classLabel = (i: ClassInfo) =>
  `${i.section.trim() || 'No section'} (${(i.schoolYear || 'no SY').replace(/^(\d{4})-\d\d(\d\d)$/, '$1-$2')})`;

const bySexThenName = (a: Learner, b: Learner) => a.sex.localeCompare(b.sex) * -1 || a.name.localeCompare(b.name);
const toLearner = (id: string, data: Partial<Learner>) => ({ ratings: {}, comments: {}, attendance: [], ...data, id }) as Learner;
const SAVED = 'ecr-class'; // this device remembers the class last worked on
const remembered = () => { try { return localStorage.getItem(SAVED) ?? undefined; } catch { return undefined; } };
const remember = (id: string) => { try { localStorage.setItem(SAVED, id); } catch { /* private mode: just not remembered */ } };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(AUTH_DISABLED ? null : undefined);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [chosen, setChosen] = useState<string | undefined>(remembered);
  const [info, setInfo] = useState<ClassInfo>(DEFAULT_INFO);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [proUntil, setProUntil] = useState<string>();

  useEffect(() => (AUTH_DISABLED ? undefined : onAuthStateChanged(auth, setUser)), []);
  const owner = AUTH_DISABLED ? undefined : user?.uid;
  const ownerField = owner ? { owner } : {};
  // The class from before multiple classes existed: classes/default, or classes/{uid} when signed in.
  const firstId = AUTH_DISABLED ? 'default' : user?.uid;

  useEffect(() => {
    setClasses([]); // a different teacher (or signed out): never keep showing the previous one's classes
    if (!firstId) return;
    const q = owner ? query(collection(db, 'classes'), where('owner', '==', owner)) : collection(db, 'classes');
    return onSnapshot(q, (s) => {
      const list = s.docs.map((d) => ({ id: d.id, info: { ...DEFAULT_INFO, ...(d.data() as Partial<ClassInfo>) } }));
      // No class yet (or the old one has no document): make the first one exist, with its learners if it had any.
      if (!list.length) void setDoc(doc(db, 'classes', firstId), ownerField, { merge: true });
      setClasses(list.sort((a, b) => classLabel(a.info).localeCompare(classLabel(b.info))));
    });
  }, [firstId, owner]);

  const email = user?.email?.toLowerCase();
  useEffect(() => {
    setProUntil(undefined);
    if (!email) return;
    return onSnapshot(doc(db, 'licenses', email), (s) => setProUntil(s.data()?.until), () => setProUntil(undefined));
  }, [email]);
  const isAdmin = !!user?.emailVerified && email === ADMIN_EMAIL;
  const pro = !PRO_ENABLED || AUTH_DISABLED || isAdmin || (!!proUntil && proUntil >= today());

  const classId = classes.some((c) => c.id === chosen) ? chosen : classes[0]?.id;

  useEffect(() => {
    if (!classId) return;
    setLoaded(false);
    setLearners([]);
    const cls = doc(db, 'classes', classId);
    const offInfo = onSnapshot(cls, (s) => setInfo({ ...DEFAULT_INFO, ...(s.data() as Partial<ClassInfo>) }));
    const offLearners = onSnapshot(collection(cls, 'learners'), (s) => {
      setLearners(s.docs.map((d) => toLearner(d.id, d.data() as Partial<Learner>)).sort(bySexThenName));
      setLoaded(true);
    });
    return () => (offInfo(), offLearners());
  }, [classId]);

  const cls = () => doc(db, 'classes', classId!);
  const learnerDoc = (id: string) => doc(cls(), 'learners', id);
  const selectClass = (id: string) => (setChosen(id), remember(id));

  const store: Store = {
    user, pro, proUntil, isAdmin, classes, classId, selectClass, info, learners, loaded,
    async createClass() {
      const ref = doc(collection(db, 'classes'));
      await setDoc(ref, { ...nextClassInfo(info), ...ownerField });
      selectClass(ref.id);
      return ref.id;
    },
    async classLearners(id) {
      const s = await getDocs(collection(db, 'classes', id, 'learners'));
      return s.docs.map((d) => toLearner(d.id, d.data() as Partial<Learner>)).sort(bySexThenName);
    },
    async archiveYear(schoolYear) {
      const b = writeBatch(db);
      for (const c of classes) if (c.info.schoolYear === schoolYear && !c.info.archived) b.set(doc(db, 'classes', c.id), { archived: true }, { merge: true });
      await b.commit();
    },
    async deleteClass(id) {
      const ref = doc(db, 'classes', id);
      const b = writeBatch(db);
      for (const l of (await getDocs(collection(ref, 'learners'))).docs) b.delete(l.ref);
      b.delete(ref);
      await b.commit();
      if (id === classId) setChosen(classes.find((c) => c.id !== id)?.id);
    },
    saveInfo: (patch) => setDoc(cls(), patch, { merge: true }),
    setField: (id, path, value) => updateDoc(learnerDoc(id), path, value === '' || value == null ? deleteField() : value),
    setRatings: (id, ratings) =>
      updateDoc(learnerDoc(id), Object.fromEntries(Object.entries(ratings).map(([k, v]) => [`ratings.${k}`, v || deleteField()]))),
    addLearner: ({ id, ...l }) => setDoc(learnerDoc(id), l),
    async addLearners(list) {
      const b = writeBatch(db);
      for (const { id, ...l } of list) b.set(learnerDoc(id), l);
      await b.commit();
    },
    removeLearner: (id) => deleteDoc(learnerDoc(id)),
    async replaceAll(newInfo, newLearners) {
      const b = writeBatch(db);
      b.set(cls(), { ...newInfo, ...ownerField });
      for (const l of learners) if (!newLearners.some((n) => n.id === l.id)) b.delete(learnerDoc(l.id));
      for (const { id, ...l } of newLearners) b.set(learnerDoc(id), l);
      await b.commit();
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
