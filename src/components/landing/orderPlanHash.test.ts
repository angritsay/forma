import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLUB_PLAN_ID, PLANS } from '@content/site/plans';
import { planFromOrderHash } from './orderPlanHash';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

describe('planFromOrderHash', () => {
  const plans = [{ id: 'monthly' }, { id: 'annual' }] as const;

  it('picks the plan a ticket names', () => {
    expect(planFromOrderHash('#order-annual', plans)?.id).toBe('annual');
    expect(planFromOrderHash('#order-monthly', plans)?.id).toBe('monthly');
  });

  it('leaves the plan alone for anything else', () => {
    expect(planFromOrderHash('#order-x', plans)).toBeUndefined();
    expect(planFromOrderHash('#order', plans)).toBeUndefined();
    expect(planFromOrderHash('#order-annual-x', plans)).toBeUndefined();
    expect(planFromOrderHash('#faq', plans)).toBeUndefined();
    expect(planFromOrderHash('', plans)).toBeUndefined();
    expect(planFromOrderHash(null, plans)).toBeUndefined();
  });

  it('can pick every real plan (ids fit the hash pattern)', () => {
    for (const p of PLANS) expect(planFromOrderHash(`#order-${p.id}`, PLANS)?.id).toBe(p.id);
    expect(PLANS.some((p) => p.id === CLUB_PLAN_ID)).toBe(true);
  });
});

describe('the tickets land on anchors that exist', () => {
  it('ClubPlans links each ticket to `#order-<plan id>`', () => {
    const src = read('./club/ClubPlans.astro');
    expect(src).toContain('href={`#order-${year.id}`}');
    expect(src).toContain('href={`#order-${thirty.id}`}');
  });

  it('/subscribe/ anchors every plan id at the form', () => {
    const src = read('../../pages/[...lang]/subscribe.astro');
    expect(src).toMatch(/PLANS\.map\(\(p\) => <span id=\{`order-\$\{p\.id\}`\}/);
  });

  it('both tickets carry a pending referral through the app (`data-club-join`)', () => {
    const src = read('./club/ClubPlans.astro');
    expect(src.match(/data-club-join/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
