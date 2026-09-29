/**
 * The homepage FAQ keeps the owner's rules about money and pairs, whatever the wording drifts to:
 * the club's monthly figure never stands without the year's price, the coach's sessions are not
 * refunded but can be moved, and joining as a pair is never sold as «вступите вдвоём — получите
 * час». Figures are computed from the content files here too, so a price change does not break
 * the test — only a sentence that stops carrying the right one does.
 */
import { describe, expect, it } from 'vitest';
import { BOOKING } from './booking';
import { FAQ, HOME_FAQ } from './faq';
import { CLUB_PLAN_ID, PLAN_BY_ID, PLANS_ENABLED, planMonthlyPrice } from './plans';
import { formatPrice } from './pricing';

const ru = FAQ.map((f) => `${f.q.ru} ${f.a.ru}`);
const en = FAQ.map((f) => `${f.q.en} ${f.a.en}`);

describe('landing FAQ', () => {
  it('has ten questions while the club and the coach are on sale', () => {
    if (PLANS_ENABLED && BOOKING.enabled) expect(FAQ).toHaveLength(10);
  });

  it('never prints the monthly club figure without the year', () => {
    const plan = PLAN_BY_ID.get(CLUB_PLAN_ID);
    if (!plan) return;
    const month = formatPrice('ru', planMonthlyPrice(plan));
    const year = formatPrice('ru', plan.price);
    for (const text of ru) if (text.includes(month)) expect(text).toContain(year);
    // English quotes the year only.
    const enMonth = formatPrice('en', planMonthlyPrice(plan));
    for (const text of en) expect(text).not.toContain(`${enMonth} a month`);
  });

  it('says coach sessions are not refunded but can be moved 24 hours ahead', () => {
    if (!BOOKING.enabled) return;
    const coach = FAQ.find((f) => f.q.ru.includes('с тренером'));
    expect(coach?.a.ru).toContain('Возврата нет');
    expect(coach?.a.ru).toContain('24 часа');
    expect(coach?.a.en).toContain('No refunds');
  });

  it('does not promise an hour for joining as a pair', () => {
    for (const text of ru) {
      expect(text).not.toMatch(/вступите вдвоём/i);
      expect(text).not.toMatch(/получите час/i);
    }
  });
});

describe('homepage FAQ', () => {
  it('is five of the ten, in their order: free, sign-in, course or club, together, auto-renewal', () => {
    if (!PLANS_ENABLED) return;
    expect(HOME_FAQ.map((f) => f.q.ru)).toEqual([
      'Что бесплатно?',
      'Как войти?',
      'Курс или клуб?',
      'Как начать вместе?',
      'Есть автосписание?',
    ]);
    for (const item of HOME_FAQ) expect(FAQ).toContain(item);
  });
});
