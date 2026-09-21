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
import { CLUB_PITCH_PHOTO_COUNT, clubPitchPhotos } from '@content/site/club';
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
   * The carousel is ten frames or every consented file there is, whichever is fewer — the owner
   * asked for ten and the product has exactly ten. A count that quietly fell back to three would
   * look like a design choice rather than like missing data.
   */
  it('fills the carousel with every consented photograph, up to ten', () => {
    const { photos } = clubPitchPhotos();
    expect(CLUB_PITCH_PHOTO_COUNT).toBe(10);
    expect(photos.length).toBe(CLUB_PITCH_PHOTO_COUNT);
    // Ten different people, not one file repeated.
    expect(new Set(photos.map((p) => p.src)).size).toBe(photos.length);
  });

  /**
   * A square cell shows the whole file, so every frame carries the description written for that
   * exact image. While the cells were narrow slices these went out unlabelled on purpose — see
   * `clubPitchPhotos()` — and losing the alt text again would be silent.
   */
  it('gives every frame its own description', () => {
    const { photos } = clubPitchPhotos();
    for (const p of photos) {
      expect(p.alt?.ru, `club photo ${p.id} has no Russian alt`).toBeTruthy();
      expect(p.alt?.en, `club photo ${p.id} has no English alt`).toBeTruthy();
    }
    expect(new Set(photos.map((p) => p.alt?.ru)).size).toBe(photos.length);
  });
});
