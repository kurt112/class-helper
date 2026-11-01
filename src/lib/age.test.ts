import { expect, test } from 'vitest';
import { ageAt } from './age';

test('matches DATEDIF Y / YM', () => {
  // 2019-06-10 is serial 43626 from the workbook; sheet shows 6y 11m at SY start, 7y 9m at SY end
  expect(ageAt('2019-06-10', '2026-06-08')).toEqual({ years: 6, months: 11 });
  expect(ageAt('2019-06-10', '2027-04-08')).toEqual({ years: 7, months: 9 });
  expect(ageAt('2019-06-08', '2026-06-08')).toEqual({ years: 7, months: 0 });
  expect(ageAt('', '2026-06-08')).toBeNull();
});
