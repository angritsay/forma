/**
 * The subscription's state in one line, for the value of the account sheet's «Подписка» row:
 * the club's price when there is none, «до 12 марта» while it runs, «до 12 марта · продлить» in
 * its last week, «Закончилась … · продлить» once it has ended, «Ждёт оплаты · оплатить» for an
 * order not yet paid. Pure; unit-tested.
 *
 * The row exists because the end date was shown nowhere (audit item 2): there is no auto-renewal,
 * and on the last day the club tab quietly turned into the selling screen. A member who can read
 * the date ahead of time is not surprised by it.
 *
 * The price is the club's own quote (`clubMonthlyLabel`, «666 ₽»), not the monthly plan's: the
 * club is sold with the annual plan, and the row must name the figure the join button names. And
 * because a tap on the row goes straight to that plan's checkout, the row also says what is
 * charged (`subscriptionChargeNote`) — the same line `ClubJoin` puts under its button.
 *
 * **Automatic renewal** (`RENEWAL`, content/site/plans.ts; off today). Once the 30-day plan charges
 * itself, a live, not-cancelled monthly subscription must never be offered «продлить»: the button
 * goes to a checkout, and a person who pays there *and* is charged by the card on file has paid
 * twice. Such a row says when the next charge is and for how much instead
 * (`subscriptionAutoRenews`). A cancelled monthly subscription and the annual plan keep the manual
 * path — neither will be charged again. Every function takes the mode as a parameter, so both
 * paths are tested while the switch is off.
 */
import type { Locale } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { clubChargeLabel, clubMonthlyLabel } from '@/app/features/marathon/clubPlan';
import {
  PLAN_BY_ID,
  planRenewsAutomatically,
  RENEWAL,
  type RenewalMode,
} from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';

/**
 * «12 марта» — the day and the month, and the year only when it is not this one. The row's value
 * sits in under half a phone's width, and «12 марта 2027 г.» spends a third of it on a year the
 * reader already knows.
 */
export function subscriptionDate(locale: Locale, iso: string, now: number): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

/**
 * Renewal is offered this long before the end while renewal is by hand (`RENEWAL`,
 * `content/site/plans.ts`); a subscription that renews by itself announces its next charge as early.
 */
export const RENEW_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;

/** A live subscription with a date that falls within {@link RENEW_AHEAD_MS}. */
function endsSoon(sub: Subscription | null, now: number): boolean {
  if (!sub || !sub.isLive || !sub.expiresAt) return false;
  const end = Date.parse(sub.expiresAt);
  return Number.isFinite(end) && end - now < RENEW_AHEAD_MS;
}

/**
 * Will this subscription be charged again by itself? Under `mode` = `'auto'` only: a live monthly
 * subscription that has not been cancelled. Always false today (`RENEWAL` = `'manual'`).
 */
export function subscriptionAutoRenews(
  sub: Subscription | null,
  mode: RenewalMode = RENEWAL,
): boolean {
  return (
    !!sub &&
    sub.isLive &&
    sub.status === 'active' &&
    !!sub.expiresAt &&
    planRenewsAutomatically(sub.plan, mode)
  );
}

/**
 * A live subscription that ends within {@link RENEW_AHEAD_MS}: time to offer «Продлить», so the
 * bot's «продли в приложении» (`subscription_ending`, 0054) points at something that exists.
 * Never for one that renews by itself — a «renew» button there would charge twice.
 */
export function subscriptionRenewDue(
  sub: Subscription | null,
  now: number = Date.now(),
  mode: RenewalMode = RENEWAL,
): boolean {
  return endsSoon(sub, now) && !subscriptionAutoRenews(sub, mode);
}

/** A subscription that renews by itself and whose next charge is within the last week. */
export function subscriptionAutoChargeSoon(
  sub: Subscription | null,
  now: number = Date.now(),
  mode: RenewalMode = RENEWAL,
): boolean {
  return endsSoon(sub, now) && subscriptionAutoRenews(sub, mode);
}

/** «1 990 ₽» — what the next automatic charge takes: the plan's own price. Null without one. */
export function autoChargeLabel(locale: Locale, sub: Subscription | null): string | null {
  const plan = sub ? PLAN_BY_ID.get(sub.plan) : undefined;
  return plan ? formatPrice(locale, plan.price) : null;
}

/**
 * Whether the row is a way to (re)join: nothing bought yet, an order still waiting for its payment
 * (the till is the way to finish it, and «Оплатил(а) с другой почты?» sits under it for the
 * payment that did not find it), the period over, or less than a week of it left.
 */
export function subscriptionLeadsToJoin(
  sub: Subscription | null,
  now: number = Date.now(),
  mode: RenewalMode = RENEWAL,
): boolean {
  if (!sub) return true;
  if (sub.status === 'pending') return true;
  return !sub.isLive || subscriptionRenewDue(sub, now, mode);
}

export function subscriptionSubtitle(
  tr: Translator,
  sub: Subscription | null,
  now: number = Date.now(),
  mode: RenewalMode = RENEWAL,
): string {
  const { t, locale } = tr;
  if (!sub) {
    const price = clubMonthlyLabel(locale);
    return price ? t('app.profileSubscriptionNoneHint', { price }) : '';
  }
  if (sub.status === 'pending') return t('app.profileSubscriptionPending');
  const date = sub.expiresAt ? subscriptionDate(locale, sub.expiresAt, now) : '';
  if (!sub.isLive) {
    return date
      ? t('app.profileSubscriptionEnded', { date })
      : t('app.profileSubscriptionEndedUndated');
  }
  if (!date) return t('app.profileSubscriptionLiveUndated');
  if (subscriptionAutoRenews(sub, mode)) {
    const price = autoChargeLabel(locale, sub);
    if (price) return t('app.profileSubscriptionAutoRenews', { date, price });
  }
  if (subscriptionRenewDue(sub, now, mode)) return t('app.profileSubscriptionRenewSoon', { date });
  if (sub.status === 'cancelled') return t('app.profileSubscriptionCancelled', { date });
  return t('app.profileSubscriptionLive', { date });
}

/**
 * «Одна оплата: 7 990 ₽ за год» — the subtitle of a row that leads to the checkout. The value
 * quotes the year divided by twelve, and the link charges the whole year at once; quoting a month
 * for a year's single payment without saying so is how chargebacks are made (`clubPlan.ts`).
 * Empty when the row leads nowhere or no plan is configured.
 */
export function subscriptionChargeNote(
  tr: Translator,
  sub: Subscription | null,
  now: number = Date.now(),
  mode: RenewalMode = RENEWAL,
): string {
  if (!subscriptionLeadsToJoin(sub, now, mode)) return '';
  const charge = clubChargeLabel(tr.locale);
  return charge ? tr.t('app.profileSubscriptionCharge', { price: charge }) : '';
}
