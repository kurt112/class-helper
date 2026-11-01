/** Same result as Excel DATEDIF(birth, at, "Y") and DATEDIF(birth, at, "YM"). */
export function ageAt(birth: string, at: string): { years: number; months: number } | null {
  if (!birth || !at) return null;
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ay, am, ad] = at.split('-').map(Number);
  const total = (ay - by) * 12 + (am - bm) - (ad < bd ? 1 : 0);
  if (Number.isNaN(total) || total < 0) return null;
  return { years: Math.floor(total / 12), months: total % 12 };
}
