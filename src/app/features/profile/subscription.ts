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
 */
import type { Locale } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { clubChargeLabel, clubMonthlyLabel } from '@/app/features/marathon/clubPlan';

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

/** Renewal is offered this long before the end: there is no auto-renewal (`content/site/plans.ts`). */
export const RENEW_AHEAD_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A live subscription that ends within {@link RENEW_AHEAD_MS}: time to offer «Продлить», so the
 * bot's «продли в приложении» (`subscription_ending`, 0054) points at something that exists.
 */
export function subscriptionRenewDue(sub: Subscription | null, now: number = Date.now()): boolean {
  if (!sub || !sub.isLive || !sub.expiresAt) return false;
  const end = Date.parse(sub.expiresAt);
  return Number.isFinite(end) && end - now < RENEW_AHEAD_MS;
}

/**
 * Whether the row is a way to (re)join: nothing bought yet, an order still waiting for its payment
 * (the till is the way to finish it, and «Оплатил(а) с другой почты?» sits under it for the
 * payment that did not find it), the period over, or less than a week of it left.
 */
export function subscriptionLeadsToJoin(
  sub: Subscription | null,
  now: number = Date.now(),
): boolean {
  if (!sub) return true;
  if (sub.status === 'pending') return true;
  return !sub.isLive || subscriptionRenewDue(sub, now);
}

export function subscriptionSubtitle(
  tr: Translator,
  sub: Subscription | null,
  now: number = Date.now(),
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
  if (subscriptionRenewDue(sub, now)) return t('app.profileSubscriptionRenewSoon', { date });
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
): string {
  if (!subscriptionLeadsToJoin(sub, now)) return '';
  const charge = clubChargeLabel(tr.locale);
  return charge ? tr.t('app.profileSubscriptionCharge', { price: charge }) : '';
}
