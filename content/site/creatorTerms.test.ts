import { describe, expect, it } from 'vitest';
import { CREATOR_TIER_BY_ID, CREATOR_TIERS, percent, proBreakEven } from './creatorTerms';

describe('creator tiers', () => {
  it('is a ladder: Pro costs a fee and keeps less of each sale', () => {
    const start = CREATOR_TIER_BY_ID.get('start')!;
    const pro = CREATOR_TIER_BY_ID.get('pro')!;
    expect(start.monthlyFee.rub).toBe(0);
    expect(pro.monthlyFee.rub).toBeGreaterThan(0);
    expect(pro.salesShare).toBeLessThan(start.salesShare);
    expect(pro.sessionsShare).toBeLessThan(start.sessionsShare);
  });

  it('keeps every share a real fraction', () => {
    for (const t of CREATOR_TIERS) {
      expect(t.salesShare).toBeGreaterThan(0);
      expect(t.salesShare).toBeLessThan(1);
      expect(t.sessionsShare).toBeGreaterThanOrEqual(0);
      expect(t.sessionsShare).toBeLessThan(1);
    }
  });

  it('says where Pro pays off', () => {
    // 4 990 ₽ / (20% − 10%) = 49 900 ₽ of sales a month.
    expect(proBreakEven('rub')).toBe(49900);
    expect(percent(0.2)).toBe('20%');
  });
});
