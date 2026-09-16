/**
 * The subscription's state in one line, for the value of the profile's row: the price when there
 * is none, the plan and its date when there is.
 */
import { formatDate } from '@/i18n/index';
import type { Subscription } from '@/lib/api/types';
import type { Translator } from '@/app/hooks/useT';
import { PLAN_BY_ID } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';

export function subscriptionSubtitle(tr: Translator, sub: Subscription | null): string {
  const { t, locale } = tr;
  const monthly = PLAN_BY_ID.get('monthly');
  if (!sub) {
    return monthly
      ? t('app.profileSubscriptionNoneHint', { price: formatPrice(locale, monthly.price) })
      : '';
  }
  const date = sub.expiresAt ? formatDate(locale, sub.expiresAt, 'long') : '';
  if (sub.status === 'pending') return t('app.profileSubscriptionPending');
  if (!sub.isLive) return t('app.profileSubscriptionEnded', { date });
  if (sub.status === 'cancelled') return t('app.profileSubscriptionCancelled', { date });
  const plan = sub.plan === 'annual' ? t('app.planAnnual') : t('app.planMonthly');
  return t('app.profileSubscriptionLive', { plan, date });
}
