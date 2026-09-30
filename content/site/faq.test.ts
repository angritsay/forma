/**
 * The homepage FAQ keeps the owner's rules about money and pairs, whatever the wording drifts to:
 * the club's monthly figure never stands without the year's price, and joining as a pair is never
 * sold as «вступите вдвоём — получите час». Figures are computed from the content files here too,
 * so a price change does not break the test — only a sentence that stops carrying the right one
 * does.
 */
import { describe, expect, it } from 'vitest';
import { HOME_FAQ } from './faq';
import { CLUB_PLAN_ID, PLAN_BY_ID, PLANS_ENABLED, planMonthlyPrice } from './plans';
import { formatPrice } from './pricing';

const ru = HOME_FAQ.map((f) => `${f.q.ru} ${f.a.ru}`);
const en = HOME_FAQ.map((f) => `${f.q.en} ${f.a.en}`);

describe('homepage FAQ', () => {
  it('is five questions, in their order: free, sign-in, course or club, together, auto-renewal', () => {
    if (!PLANS_ENABLED) return;
    expect(HOME_FAQ.map((f) => f.q.ru)).toEqual([
      'Что бесплатно?',
      'Как войти?',
      'Курс или клуб?',
      'Как начать вместе?',
      'Есть автосписание?',
    ]);
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

  it('does not promise an hour for joining as a pair', () => {
    for (const text of ru) {
      expect(text).not.toMatch(/вступите вдвоём/i);
      expect(text).not.toMatch(/получите час/i);
    }
  });

  it('does not sell the course "for life" in English', () => {
    for (const text of en) expect(text).not.toMatch(/for life/i);
  });
});
