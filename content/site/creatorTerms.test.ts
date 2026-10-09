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

describe('the database agrees', () => {
  it('has the same shares and fees in creator_terms (0064)', async () => {
    const { readFileSync } = await import('node:fs');
    const sql = readFileSync('supabase/migrations/0064_creators.sql', 'utf8');
    for (const tier of CREATOR_TIERS) {
      const row = new RegExp(
        `\\('${tier.id}',\\s*([\\d.]+)::numeric,\\s*([\\d.]+)::numeric,\\s*([\\d.]+)::numeric,\\s*([\\d.]+)::numeric\\)`,
      ).exec(sql);
      expect(row, `creator_terms row for ${tier.id}`).not.toBeNull();
      expect(Number(row![1])).toBe(tier.salesShare);
      expect(Number(row![2])).toBe(tier.sessionsShare);
      expect(Number(row![3])).toBe(tier.monthlyFee.rub);
      expect(Number(row![4])).toBe(tier.monthlyFee.usd);
    }
  });
});
