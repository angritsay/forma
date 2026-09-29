/**
 * The subscription's state in one line, for the value of the account sheet's «Подписка» row:
 * the club's price when there is none, «до 12 марта» while it runs, «Закончилась … · продлить»
 * once it has ended. Pure; unit-tested.
 *
 * The row exists because the end date was shown nowhere (audit item 2): there is no auto-renewal,
 * and on the last day the club tab quietly turned into the selling screen. A member who can read
 * the date ahead of time is not surprised by it.
 *
 * The price is the club's own quote (`clubMonthlyLabel`, «666 ₽»), not the monthly plan's: the
 * club is sold with the annual plan, and the row must name the figure the join button names.
 */
import type { Locale } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { clubMonthlyLabel } from '@/app/features/marathon/clubPlan';

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
 * Whether the row is a way to (re)join: nothing bought yet, or the period is over. A pending
 * payment is not — the money is on its way, and a second payment link beside it invites a
 * double charge.
 */
export function subscriptionLeadsToJoin(sub: Subscription | null): boolean {
  if (!sub) return true;
  return sub.status !== 'pending' && !sub.isLive;
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
  if (sub.status === 'cancelled') return t('app.profileSubscriptionCancelled', { date });
  return t('app.profileSubscriptionLive', { date });
}
