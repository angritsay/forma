import { describe, expect, it } from 'vitest';
import { CLUB_PLAN_ID, PLAN_BY_ID, planMonthlyPrice } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';
import { clubPriceLabels } from './clubPrice';

describe('clubPriceLabels', () => {
  const plan = PLAN_BY_ID.get(CLUB_PLAN_ID)!;

  it('never prints the monthly figure without the year’s charge beside it (RU)', () => {
    const ru = clubPriceLabels('ru')!;
    const month = formatPrice('ru', planMonthlyPrice(plan));
    const year = formatPrice('ru', plan.price);
    expect(ru.headline).toContain(month);
    expect(ru.join).toContain(month);
    expect(ru.charge).toContain(year);
    expect(ru.chargeShort).toContain(year);
  });

  it('leads with the year on EN and names no monthly figure anywhere', () => {
    const en = clubPriceLabels('en')!;
    const month = formatPrice('en', planMonthlyPrice(plan));
    const year = formatPrice('en', plan.price);
    expect(en.headline).toContain(year);
    expect(en.join).toContain(year);
    expect(en.charge).toContain(year);
    for (const text of Object.values(en)) {
      expect(text).not.toContain(`${month} /`);
      expect(text).not.toMatch(/\/\s*mo\b|a month/);
    }
  });
});
