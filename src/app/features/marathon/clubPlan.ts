/**
 * What joining the club costs, and where the person goes to do it.
 *
 * ## The price
 *
 * «Вступить за 666 ₽ / мес» is the owner's own button, and her own gloss on it is «666 в месяц это
 * доступ на год разделенный на двенадцать месяцев». So the club is sold with the **annual** plan:
 * one charge of 7 990 ₽ for a year, quoted per month because that is the figure a reader can hold.
 * `CLUB_PLAN_ID` in `content/site/plans.ts` carries the reasoning for it being that plan and not a
 * new 7 992 ₽ twin beside it.
 *
 * The monthly figure is never typed anywhere: `planMonthlyPrice()` divides the year by twelve and
 * `formatPrice` rounds it, so the number on the button is arithmetic on the number that is charged.
 * Change the plan's price and the button follows it. The screen states the charge itself under the
 * button — quoting a month for a year's single payment is how chargebacks are made.
 *
 * ## The link
 *
 * **Never a payment link with a price in it.** `docs/SETUP.md` §7.1: the site is static and public,
 * so `&price=…` in a URL is a price the payer can edit before paying. `paymentUrl` is a Prodamus
 * product whose amount is locked on Prodamus's side, and the only thing this app ever appends is
 * the signed-in email — the key that ties the payment back to the account.
 *
 * When there is no usable link the button does not pretend: it goes to `/subscribe/`, the page that
 * holds the plans, exactly as `BookScreen` falls back to writing to the coach when `paymentUrl` is
 * empty. A demo account is sent there too — a demo must never reach a real payment page.
 */
import { CLUB_PLAN_ID, PLAN_BY_ID, planMonthlyPrice } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';
import type { Locale } from '@/i18n/index';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { subscribeHref } from '@/app/features/courses/courseMeta';

/** The plan the club is sold with, or null when plans are not configured. */
export function clubPlan() {
  return PLAN_BY_ID.get(CLUB_PLAN_ID) ?? null;
}

/** «666 ₽» — the year divided by twelve, never a second literal. Null without a plan. */
export function clubMonthlyLabel(locale: Locale): string | null {
  const plan = clubPlan();
  return plan ? formatPrice(locale, planMonthlyPrice(plan)) : null;
}

/** «7 990 ₽» — what is actually charged, and what the screen says under the button. */
export function clubChargeLabel(locale: Locale): string | null {
  const plan = clubPlan();
  return plan ? formatPrice(locale, plan.price) : null;
}

/**
 * Where the join button goes: the plan's own Prodamus product with the email appended, or the
 * plans page when there is no usable link (and always for a demo account).
 */
export function clubJoinHref(locale: Locale, email: string, demo: boolean): string {
  const plan = clubPlan();
  const target = demo ? null : paymentTarget(plan?.paymentUrl?.[locale] ?? plan?.paymentUrl?.ru);
  if (!target) return subscribeHref(locale);
  return email ? withEmail(target, email) : target.href;
}
