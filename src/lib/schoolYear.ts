import type { ClassInfo } from '../types';

const plusYear = (iso: string) => (iso ? `${+iso.slice(0, 4) + 1}${iso.slice(4)}` : iso);

/** School details for a new class: the same year, or the next one once this year has ended (e.g. 2026-2027 -> 2027-2028). */
export function nextClassInfo(info: ClassInfo, today = new Date().toISOString().slice(0, 10)): ClassInfo {
  const fresh = { ...info, section: '', archived: false };
  if (!info.syEnd || info.syEnd >= today) return fresh;
  return {
    ...fresh,
    schoolYear: info.schoolYear.replace(/\d{4}/g, (y) => String(+y + 1)),
    syStart: plusYear(info.syStart),
    syEnd: plusYear(info.syEnd),
  };
}
