import { describe, expect, it } from 'vitest';
import { COURSES } from '@/content/registry';
import { PLANS } from './plans';

/**
 * The prices of the two products must not collide, because the payment webhook tells them apart by
 * amount and nothing else.
 *
 * `prodamus-webhook` asks `planForAmount()` first: a notification whose `sum` equals a plan's price
 * activates a subscription, and only the amounts that match no plan fall through to the course
 * branch. So the day a course is priced at exactly 1 990 ₽, buying that course would quietly open a
 * month of everything instead — no error, no log, a happy customer and a hole in the revenue.
 *
 * The webhook cannot defend itself here. A short Prodamus link drops the query parameters it is
 * given (docs/SETUP.md §7.1), so the course id cannot travel with the payment, and the course
 * branch resolves the product from the pending order rather than from the amount. That resolution
 * never runs if the plan check has already claimed the notification. The only place this can be
 * caught is where the numbers are written down, which is here.
 *
 * Withdrawn courses are included on purpose: `COURSES`, not `LIVE_COURSES`. A course taken off sale
 * keeps its `paymentUrl`, and a link somebody saved still charges its old price.
 */
describe('course prices against plan prices', () => {
  /** The rule as a function, so it is shown to catch something before it is aimed at real data. */
  function collisions(
    coursePrices: readonly { id: string; rub: number }[],
    planPrices: readonly number[],
  ): string[] {
    const plans = new Set(planPrices);
    return coursePrices.filter((c) => c.rub > 0 && plans.has(c.rub)).map((c) => c.id);
  }

  it('catches a collision when there is one', () => {
    expect(collisions([{ id: 'x', rub: 1990 }], [1990, 7990])).toEqual(['x']);
    expect(collisions([{ id: 'x', rub: 2990 }], [1990, 7990])).toEqual([]);
    // A free course shares "0" with nothing: it is never paid for, so it never reaches the webhook.
    expect(collisions([{ id: 'x', rub: 0 }], [0])).toEqual([]);
  });

  it('holds for every course and every plan we actually sell', () => {
    const planPrices = PLANS.map((p) => p.price.rub);
    const coursePrices = COURSES.map((c) => ({ id: c.id, rub: c.price.rub }));
    expect(collisions(coursePrices, planPrices)).toEqual([]);
  });

  /* The plans must also differ from each other, for the same reason and in the same file. */
  it('prices the two plans differently', () => {
    const rub = PLANS.map((p) => p.price.rub);
    expect(new Set(rub).size).toBe(rub.length);
  });
});
