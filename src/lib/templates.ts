// Export templates uploaded by the teacher. They are ~3 MB each (too big for Firestore), so they live in
// this browser's IndexedDB. shortcut: per device only; move to Firebase Storage if teachers need them everywhere.
export interface Template {
  id: string;
  name: string;
  /** School years this template is used for, e.g. ["2026-2027", "2027-2028"] */
  years: string[];
  /** The blanked workbook */
  bytes: Uint8Array;
  added: string; // ISO time
  /** PACE formulas that read other cells than the app writes (see paceProblems) */
  warnings: string[];
}

function store<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('ecr-templates', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('templates', { keyPath: 'id' });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = run(open.result.transaction('templates', mode).objectStore('templates'));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

export const listTemplates = () => store<Template[]>('readonly', (s) => s.getAll());
export const saveTemplate = (t: Template) => store('readwrite', (s) => s.put(t));
export const deleteTemplate = (id: string) => store('readwrite', (s) => s.delete(id));

/** Splits "2026-2027, 2027-2028" into school years. */
export const parseYears = (text: string) => [...new Set(text.split(/[,;\s]+/).map((y) => y.trim()).filter(Boolean))];

/** The template for a school year: the most recently added one that lists it; undefined means the built-in one. */
export const pickTemplate = (list: Template[], year: string) =>
  list.filter((t) => t.years.includes(year.trim())).sort((a, b) => b.added.localeCompare(a.added))[0];
