/**
 * The club's price and the photographs under it, guarded.
 *
 * Three promises are made in prose around this screen and prose does not fail a build: that the
 * «666 ₽ / мес» on the button is arithmetic on the year's price rather than a second literal, that
 * the link the button opens never carries an amount, and that nothing reaches the row of
 * photographs without a recorded consent date.
 */
import { describe, expect, it } from 'vitest';
import { CLUB_PLAN_ID, PLAN_BY_ID, planMonthlyPrice } from '@content/site/plans';
import { CLUB_PITCH_CELL_RATIO, clubPitchPhotos, panelFocus } from '@content/site/club';
import { clubChargeLabel, clubJoinHref, clubMonthlyLabel, clubPlan } from './clubPlan';

describe('the club price', () => {
  it('is the annual plan, divided by twelve', () => {
    // The owner: «666 в месяц это доступ на год разделенный на двенадцать месяцев», and «Только
    // 7990 а не 7992». The year is the price; the month is round(7990 / 12) = 666. So there is one
    // product, not a second one at 666 × 12 beside it.
    const plan = clubPlan();
    expect(plan?.id).toBe(CLUB_PLAN_ID);
    expect(plan?.period).toBe('year');
    expect(planMonthlyPrice(plan!).rub).toBe(Math.round(plan!.price.rub / 12));
    expect(clubMonthlyLabel('ru')).toContain('666');
  });

  it('says what is actually charged', () => {
    // The button quotes a month; this is the single payment behind it, and the screen prints it
    // directly under the pill.
    const plan = PLAN_BY_ID.get(CLUB_PLAN_ID)!;
    expect(clubChargeLabel('ru')).toBe(
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }).format(plan.price.rub),
    );
  });

  it('leaves a monthly plan alone', () => {
    const monthly = PLAN_BY_ID.get('monthly')!;
    expect(planMonthlyPrice(monthly)).toEqual(monthly.price);
  });
});

describe('the join link', () => {
  it('never carries an amount', () => {
    // docs/SETUP.md §7.1: the site is static and public, so a price in a query string is a price
    // the payer can edit. The email is the only thing this app appends.
    const href = clubJoinHref('ru', 'someone@example.com', false);
    const url = new URL(href, 'https://forma-app.co');
    for (const key of url.searchParams.keys()) {
      expect(key).toMatch(/^(email|customer_email)$/);
    }
    expect(href).not.toMatch(/price|sum|amount|order_sum/i);
  });

  it('keeps a demo account away from a real payment page', () => {
    expect(clubJoinHref('ru', 'demo@example.com', true)).not.toMatch(/^https?:/);
  });
});

describe('the photographs on the selling screen', () => {
  it('publishes nothing without a recorded consent date', () => {
    const { photos, source } = clubPitchPhotos();
    for (const p of photos) {
      expect(p.consent, `club photo ${p.id} has no consent date`).toBeTruthy();
      expect(p.src.length).toBeGreaterThan(0);
    }
    // While the row falls back to the coach's own clients the label has to say so — «Результаты
    // участников» over those photographs, beside a price, claims the club produced them.
    expect(['members', 'coachClients']).toContain(source);
  });

  /**
   * The crop maths, because the old fixed «74%» read like a crop centre and was not one: it put
   * the middle of the slice at 0.664 of the file, eight points left of everybody in the row.
   */
  it('puts the middle of the slice on the subject, not the percentage', () => {
    const r = CLUB_PITCH_CELL_RATIO;
    for (const center of [0.5, 0.733, 0.76, 0.758]) {
      const p = panelFocus(center);
      // The slice `object-position: p%` actually selects, and where its middle lands.
      const left = p * (1 - r);
      expect(left + r / 2).toBeCloseTo(center, 6);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left + r).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('never asks for a slice that hangs off the file', () => {
    expect(panelFocus(0.99)).toBe(1);
    expect(panelFocus(0.01)).toBe(0);
  });

  it('gives each composite its own crop', () => {
    const { photos } = clubPitchPhotos();
    const focuses = photos.map((p) => p.focus);
    for (const f of focuses) expect(f).toMatch(/^\d+(\.\d+)?% 50%$/);
    // Three people standing in three different places: one number for all three is the bug.
    expect(new Set(focuses).size).toBe(focuses.length);
  });
});
