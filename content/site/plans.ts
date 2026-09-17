/**
 * Subscription plans: one price for every course, monthly or annual.
 *
 * Why this exists next to the one-off courses: a course is bought once and kept forever; a
 * subscription is paid every period and covers all of them plus whatever is added. The two
 * are sold side by side — the course as the entry step, the subscription as the way to stay.
 *
 * `paymentUrl` follows the course rule (docs/SETUP.md §7.1): an absolute https link per locale
 * pointing at a Prodamus product with the price locked on its side; the visitor's email is
 * appended as `?email=` and nothing else, because a price carried in a URL is a price the payer
 * can edit.
 *
 * Both are one-off products rather than recurring ones: Prodamus bills recurrently only through
 * its club system, which is a separate paid connection and is not in place. So a payment opens a
 * period and then stops — the monthly plan's own copy says so, and the day the club system is
 * connected only these two links change.
 *
 * The webhook (docs/SETUP.md §7.4) matches a payment to a plan **by its amount**, so these prices,
 * the amounts configured in Prodamus, and the PLAN_MONTHLY_RUB / PLAN_ANNUAL_RUB secrets must all
 * agree. When they drift, payments arrive and silently open nothing.
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
    /*
     * «Доступ на 30 дней», not «подписка»: Prodamus only bills recurrently through its club
     * system, which has to be applied for and paid for separately and is not connected yet. Until
     * it is, this is a one-off payment that opens thirty days and then stops — and the note says
     * so, because a person who believed they were subscribed and then lost access is a refund and
     * a bad review, not a churned customer.
     */
    name: { ru: 'Доступ на 30 дней', en: '30 days of access' },
    price: { rub: 1990, usd: 19 },
    period: 'month',
    note: {
      ru: 'Автосписания пока нет — продлевается вручную',
      en: 'No auto-renewal yet — renewed by hand',
    },
    paymentUrl: { ru: 'https://payform.ru/lvcyfuk/' },
  },
  {
    id: 'annual',
    name: { ru: 'Доступ на год', en: 'A year of access' },
    price: { rub: 7990, usd: 79 },
    period: 'year',
    /* 7 990 / 1 990 ≈ 4: the year costs what four months would, and runs twelve. */
    note: {
      ru: '≈ 666 ₽ в месяц — цена четырёх месяцев за двенадцать',
      en: '≈ $6.60 a month — four months’ price for twelve',
    },
    paymentUrl: { ru: 'https://payform.ru/74cyg8P/' },
  },
];

/**
 * The plan the club's selling screen offers, and it is the **existing annual one**.
 *
 * The owner's «666 ₽ / мес» is this plan and not a new product: «666 в месяц это доступ на год
 * разделенный на двенадцать месяцев», and 7 990 / 12 = 665.83 → «666 ₽» is exactly the figure this
 * plan's own note has quoted since it was written. Standing a second product beside it at 666 × 12
 * = 7 992 would sell the same year twice, two roubles apart, and break the webhook's match-by-
 * amount against PLAN_ANNUAL_RUB. So there is one annual product, it already has a Prodamus link
 * with its amount locked, and the club is sold with it.
 *
 * The club is not *gated* to this plan — `gameAccess` opens on any live subscription, so a monthly
 * subscriber plays too. This is only what the selling screen offers somebody with nothing yet.
 */
export const CLUB_PLAN_ID: SubscriptionPlan = 'annual';

/**
 * «666 ₽ / мес» as arithmetic on the year's price, never as a second number.
 *
 * The owner settled the club's price as «666 в месяц это доступ на год разделенный на двенадцать
 * месяцев», and corrected the arithmetic herself — «Только 7990 а не 7992». So the year's price is
 * the number, 7 990 ₽, and 666 is `Math.round(7990 / 12)` = round(665.83): one annual charge,
 * quoted per month because that is the figure that means something to a reader.
 *
 * It is derived rather than written down for the reason `bookingFromPrice()` is: the charged
 * amount is the one that has to agree with Prodamus and with the PLAN_ANNUAL_RUB secret (the
 * webhook matches a payment to a plan **by its amount**, docs/SETUP.md §7.4), and a hand-typed
 * monthly twin would drift away from it silently — with the drifted number on the button.
 *
 * Rounded here rather than left to the formatter, so the figure is a price and not a formatting
 * accident: `formatPrice` happens to drop the fraction today, and a locale that did not would put
 * «665,83 ₽» on a button the owner wrote as «666 ₽». The two roubles are why the screen prints the
 * year's real price directly under the pill.
 *
 * A monthly plan is returned unchanged: its price already is per month.
 */
export function planMonthlyPrice(plan: Plan): CoursePrice {
  if (plan.period === 'month') return plan.price;
  return { rub: Math.round(plan.price.rub / 12), usd: Math.round(plan.price.usd / 12) };
}

export const PLAN_BY_ID: ReadonlyMap<SubscriptionPlan, Plan> = new Map(PLANS.map((p) => [p.id, p]));

/** What every plan includes; shown on the subscribe page and in the app. */
export const PLAN_INCLUDES: readonly L10n[] = [
  /*
   * Deliberately not a count. Only the beginner course is on sale at launch (`published` in
   * src/content/schema.ts), and a line that names a number goes stale the moment a course is
   * held back or added — which is exactly when nobody re-reads the marketing copy.
   */
  {
    ru: 'Все курсы Forma — и каждый новый, как только выходит',
    en: 'Every Forma course — and each new one the day it lands',
  },
  {
    ru: 'Нагрузка подстраивается под тебя после каждой тренировки',
    en: 'Load adapts to you after every workout',
  },
  { ru: 'Новые курсы — сразу, без доплат', en: 'New courses as they appear, at no extra cost' },
  { ru: 'Прогресс, шаги, таблица лидеров', en: 'Progress, steps and the leaderboard' },
];

/**
 * Is the subscription on sale at all: hides the page, the cards and the app entry points.
 *
 * On, with both payment links filled in. It was off while only the beginner course was for sale:
 * a subscription that covers one 2 990 ₽ course made the subscription look poor value and the
 * course look expensive at the same time.
 *
 * `false` removes the /subscribe/ page from the build and the sitemap (src/lib/seo/pages.ts),
 * the plan card from the course page, the banner from the landing, and the subscription rows
 * from Profile and Admin. Nothing else needs editing.
 */
export const PLANS_ENABLED = true;

/**
 * The challenge belongs to the subscription, not to everyone.
 *
 * Its prize is an hour of the coach's time every week — the same hour `booking.ts` sells for
 * 3 500 ₽. Given away, the format costs more the better it does, and the coach is the one paying.
 * Behind the subscription it does the opposite: a course runs out after four weeks and a challenge
 * never does, so it is the reason to still be paying next month.
 *
 * It follows `PLANS_ENABLED` rather than being its own switch, because a subscription that is not
 * on sale cannot be required. While plans are off the challenge is simply open — which is also what the
 * coach needs in order to run it with people he added by hand.
 */
export const GAME_REQUIRES_SUBSCRIPTION = PLANS_ENABLED;
