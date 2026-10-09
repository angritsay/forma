/**
 * Subscription plans: the club and every course, monthly or annual.
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
 * period and then stops — the monthly plan's own copy says so. Automatic monthly renewal is built
 * and waiting behind one switch, `RENEWAL` below; docs/SETUP.md §7.18 is the procedure.
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

/**
 * How the 30-day plan renews: `'manual'` (today — a one-off payment, «Автосписаний нет») or
 * `'auto'` (a Prodamus subscription that charges the same card every 30 days until cancelled).
 *
 * **Leave it at `'manual'` until all of these are true** — docs/SETUP.md §7.18 is the checklist:
 *
 *   1. Prodamus has approved its subscriptions module and a monthly subscription product exists at
 *      exactly the monthly price; its link is in `MONTHLY_AUTO_PAYMENT_URL` below.
 *   2. A lawyer has read the auto-mode wording: the offer and refund clauses in
 *      `src/components/landing/legal.ts` (marked «draft for the lawyer»), the `…Auto` keys in
 *      `src/i18n/{ru,en}/landing.ts` and `app.ts`, the monthly note below, the FAQ in
 *      `content/site/faq.ts` and the bot's reminder in `supabase/functions/telegram-notify/copy.ts`.
 *   3. `PRICING.legalUpdatedAt` (`content/site/pricing.ts`) is bumped **in the same commit** to a
 *      date on or after `AUTO_RENEW_TEXT_DATE` — the offer's wording changes with the switch, and
 *      the consent log must name the version people actually agreed to (`renewal.test.ts` fails
 *      otherwise).
 *   4. The bot's mirror, `RENEWAL` in `supabase/functions/telegram-notify/copy.ts`, is flipped in
 *      the same commit (the edge function cannot import this file; `renewal.test.ts` holds the two
 *      equal) and the function is redeployed.
 *
 * What `'auto'` covers is **the monthly plan only**. The annual plan stays a one-off payment with
 * the manual renewal reminder: a silent 7 990 ₽ charge a year after somebody last thought about
 * the club is the textbook chargeback, and the year is the plan the club is sold with — its line
 * «Одна оплата: 7 990 ₽ за год» is the promise the whole selling screen is built on. Making the
 * year recurring too would be a separate decision with its own wording.
 *
 * Every piece of copy that depends on it is selected through `planRenewsAutomatically` /
 * `byRenewal`, which take the mode as a parameter, so both variants are tested while this stays
 * `'manual'`.
 */
export type RenewalMode = 'manual' | 'auto';
export const RENEWAL: RenewalMode = 'manual';

/**
 * The day the auto-mode legal wording was written (the renewal clauses of the offer and the refund
 * policy in `legal.ts`). When `RENEWAL` is `'auto'`, `PRICING.legalUpdatedAt` must not be older
 * than this — a consent stamped with an older version would point at a text that says
 * «автосписаний нет». If the lawyer changes the wording, move this date with it.
 */
export const AUTO_RENEW_TEXT_DATE = '2026-10-09';

/**
 * The Prodamus **subscription** product for the 30-day plan, filled in the day the module is
 * approved (docs/SETUP.md §7.18). Read only when `RENEWAL` is `'auto'`; until then the one-off
 * link below stays the plan's link. Same rule as every payment link: the amount is locked on
 * Prodamus's side and only `?email=` is ever appended.
 */
export const MONTHLY_AUTO_PAYMENT_URL: PaymentUrl | undefined = undefined;

/** The one-off 30-day product: sold today, and kept working after the switch (§7.18). */
export const MONTHLY_ONE_OFF_PAYMENT_URL: PaymentUrl = { ru: 'https://payform.ru/lvcyfuk/' };

/** Does this plan charge itself again under `mode`? Only the monthly one, and only in auto mode. */
export function planRenewsAutomatically(
  plan: SubscriptionPlan,
  mode: RenewalMode = RENEWAL,
): boolean {
  return mode === 'auto' && plan === 'monthly';
}

/** Pick the variant for the renewal mode — the one place a `manual | auto` pair is resolved. */
export function byRenewal<T>(variants: { manual: T; auto: T }, mode: RenewalMode = RENEWAL): T {
  return variants[mode];
}

/** The plans as they are sold under `mode`; `PLANS` is this for `RENEWAL`. */
export function plansFor(mode: RenewalMode): readonly Plan[] {
  return [
    {
      id: 'monthly',
      /*
       * «Доступ на 30 дней», not «подписка»: Prodamus only bills recurrently through its club
       * system, which has to be applied for and paid for separately and is not connected yet.
       * Until it is, this is a one-off payment that opens thirty days and then stops — and the
       * note says so, because a person who believed they were subscribed and then lost access is a
       * refund and a bad review, not a churned customer. In auto mode the name still holds (each
       * charge buys thirty days of access); the note is what says it renews.
       */
      name: { ru: 'Доступ на 30 дней', en: '30 days of access' },
      price: { rub: 1990, usd: 19 },
      period: 'month',
      note: byRenewal(
        {
          manual: {
            ru: 'Автосписаний нет — продлевается вручную',
            en: 'No auto-renewal — renewed by hand',
          },
          // Draft for the lawyer — not shown until RENEWAL = 'auto'.
          auto: {
            ru: 'Продлевается сам каждые 30 дней, пока не отменишь',
            en: 'Renews every 30 days until you cancel',
          },
        },
        mode,
      ),
      paymentUrl: byRenewal(
        { manual: MONTHLY_ONE_OFF_PAYMENT_URL, auto: MONTHLY_AUTO_PAYMENT_URL },
        mode,
      ),
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
}

export const PLANS: readonly Plan[] = plansFor(RENEWAL);

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

/**
 * What every plan includes; shown on the club page (/subscribe/) and in the landing's banner.
 *
 * The club first, because that is what the subscription is sold as now (the owner: /subscribe
 * becomes «Клуб + курс»), then the course that comes with it. What the club *is* follows the
 * app's own club screen: one small task a day, the week's board with its prize, the streak, and
 * the duo — `gameAccess` opens all of it on any live subscription.
 *
 * The course line names the one course on sale and promises the rest without a count: a line
 * that names a number goes stale the moment a course is held back or added.
 */
export const PLAN_INCLUDES: readonly L10n[] = [
  {
    ru: 'Клуб: одно маленькое задание в день, таблица недели и приз — час с тренером',
    en: 'The club: one small task a day, the weekly board and a prize — an hour with the coach',
  },
  {
    ru: 'Серия дней подряд и пара на неделю — или подруга или друг по приглашению',
    en: 'A streak, and a partner for the week — or a friend by invitation',
  },
  {
    ru: 'Курс «Форма с нуля» — и каждый новый курс, как только выходит',
    en: 'The Start course — and every new course the day it lands',
  },
  {
    ru: 'Нагрузка подстраивается под тебя после каждой тренировки',
    en: 'Load adapts to you after every workout',
  },
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
