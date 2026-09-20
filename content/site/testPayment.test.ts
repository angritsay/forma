import { describe, expect, it } from 'vitest';
import { allCourses } from '@/content/catalogue';
import { PLANS } from './plans';
import { TEST_PAYMENT_URL } from './testPayment';

/*
 * The override is temporary by construction, and this is what makes sure it stays that way.
 *
 * It does not fail when the override is on — it is on deliberately, to run a real payment through
 * at 50 ₽ instead of 2 990. What it does is guard the way back: while the override is up, every
 * real link has to still be sitting where it was, so that putting `null` in one line restores the
 * product rather than leaving it pointing at nothing.
 */
describe('TEST_PAYMENT_URL', () => {
  it('is an https product link when it is set at all', () => {
    if (TEST_PAYMENT_URL === null) return;
    expect(TEST_PAYMENT_URL).toMatch(/^https:\/\//);
    // No amount in the URL, ever: the site is static and public, so a price carried in a link is
    // a price the payer edits before paying (docs/SETUP.md §7.1). Even a test link obeys that.
    expect(TEST_PAYMENT_URL).not.toMatch(/[?&](price|sum|amount)=/i);
  });

  /*
   * The real links are what the override hides, not what it replaces. If one of them were emptied
   * or edited away while the override was up, nothing would notice until the day it came down —
   * and then the buttons would quietly stop going anywhere.
   */
  it('hides real links rather than replacing them: every plan still has its own', () => {
    for (const plan of PLANS) {
      expect(plan.paymentUrl?.ru, `plan ${plan.id} lost its payment link`).toMatch(/^https:\/\//);
      if (TEST_PAYMENT_URL) expect(plan.paymentUrl?.ru).not.toBe(TEST_PAYMENT_URL);
    }
  });

  it('and every course that had one still has it', () => {
    for (const course of allCourses()) {
      const url = course.paymentUrl?.ru ?? course.paymentUrl?.en;
      if (!url) continue;
      expect(url, `course ${course.id} lost its payment link`).toMatch(/^https:\/\//);
      if (TEST_PAYMENT_URL) expect(url).not.toBe(TEST_PAYMENT_URL);
    }
  });
});
