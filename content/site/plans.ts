/**
 * Subscription plans: one price for every course, monthly or annual.
 *
 * Why this exists next to the one-off courses: a course is bought once and kept forever; a
 * subscription is paid every period and covers all of them plus whatever is added. The two
 * are sold side by side — the course as the entry step, the subscription as the way to stay.
 *
 * `paymentUrl` follows the course rule (docs/SETUP.md §7.1): an absolute https link per locale
 * pointing at the seller's Prodamus subscription product; the visitor's email is appended as
 * `?email=`. The webhook (docs/SETUP.md §7.4) matches a payment to a plan by its amount, so keep
 * these prices identical to the amounts configured on the payment side.
 */
import type { L10n, PaymentUrl } from '@/content/schema';
import type { SubscriptionPlan } from '@/lib/api/types';
import type { CoursePrice } from './pricing';

export interface Plan {
  id: SubscriptionPlan;
  name: L10n;
  /** Per period, in the locale's currency. */
  price: CoursePrice;
  /** 'month' | 'year' — for the "/ month" suffix and schema.org billing duration. */
  period: 'month' | 'year';
  /** Short line under the price. */
  note: L10n;
  paymentUrl?: PaymentUrl;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'monthly',
    name: { ru: 'Форма на месяц', en: 'Forma. Monthly' },
    price: { rub: 1990, usd: 19 },
    period: 'month',
    note: { ru: 'Отмена в любой момент', en: 'Cancel any time' },
    paymentUrl: {},
  },
  {
    id: 'annual',
    name: { ru: 'Форма на год', en: 'Forma. Annual' },
    price: { rub: 9990, usd: 99 },
    period: 'year',
    note: {
      ru: '≈ 833 ₽ в месяц — семь месяцев бесплатно',
      en: '≈ $8 a month — seven months free',
    },
    paymentUrl: {},
  },
];

export const PLAN_BY_ID: ReadonlyMap<SubscriptionPlan, Plan> = new Map(PLANS.map((p) => [p.id, p]));

/** What every plan includes; shown on the subscribe page and in the app. */
export const PLAN_INCLUDES: readonly L10n[] = [
  { ru: 'Все 5 курсов — 30 недель программ', en: 'All 5 courses — 30 weeks of programs' },
  {
    ru: 'Нагрузка подстраивается под тебя после каждой тренировки',
    en: 'Load adapts to you after every workout',
  },
  { ru: 'Новые курсы — сразу, без доплат', en: 'New courses as they appear, at no extra cost' },
  { ru: 'Статистика, шаги, таблица лидеров', en: 'Stats, steps and the leaderboard' },
];

/** Is the subscription on sale at all: hides the page, the cards and the app entry points. */
export const PLANS_ENABLED = true;
