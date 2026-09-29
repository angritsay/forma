/**
 * The club's price as the site says it — one place, so the two rules about it cannot drift apart
 * between the homepage, the price ladder and the sticky bar.
 *
 * 1. **666 never stands alone.** «666 ₽ / мес» is the year's single charge divided by twelve
 *    (`planMonthlyPrice`, content/site/plans.ts), so wherever the monthly figure is printed, the
 *    charge — «Оплата одна: 7 990 ₽ за год…», the app's own `app.clubChargeNote` — is printed
 *    beside it. Callers get both from here and never one without the other.
 * 2. **English leads with the year and shows no month.** `planMonthlyPrice` gives $7 and the
 *    plan's note says ≈ $6.60; until the two agree the EN site says «$79 a year» and nothing per
 *    month (docs: site synthesis §5, owner question 5).
 *
 * Every figure comes from `PLAN_BY_ID` / `PLANS`; nothing here is typed by hand. Null when plans
 * are switched off or the club's plan is missing, and the caller then draws no price at all.
 */
import {
  CLUB_PLAN_ID,
  PLAN_BY_ID,
  PLANS,
  PLANS_ENABLED,
  planMonthlyPrice,
} from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';
import type { Locale } from '@/content/schema';
import { t } from '@/i18n/index';

export interface ClubPriceLabels {
  /** The big figure: «666 ₽ / мес» on RU, «$79 a year» on EN. */
  headline: string;
  /** The join button: «Вступить за 666 ₽ / мес» / «Join — $79 a year». */
  join: string;
  /** The charge, always shown with the headline: `app.clubChargeNote` with the year's price. */
  charge: string;
  /**
   * The shorter line for a tight spot (the sticky bar), under the join button: the year's charge
   * on RU, «7 990 ₽ за год, одной оплатой», where the button quotes the month; «No auto-renewal»
   * on EN, where the button already names the year.
   */
  chargeShort: string;
  /** The 30-day alternative, «Или доступ на 30 дней — 1 990 ₽»; empty without that plan. */
  monthly: string;
}

export function clubPriceLabels(locale: Locale): ClubPriceLabels | null {
  if (!PLANS_ENABLED) return null;
  const plan = PLAN_BY_ID.get(CLUB_PLAN_ID);
  if (!plan) return null;
  const year = formatPrice(locale, plan.price);
  const perMonth = formatPrice(locale, planMonthlyPrice(plan));
  const leadsWithYear = locale !== 'ru';
  const thirty = PLANS.find((p) => p.period === 'month' && p.id !== CLUB_PLAN_ID);
  return {
    headline: leadsWithYear
      ? t(locale, 'landing.clubPriceYear', { price: year })
      : t(locale, 'landing.clubPriceMonth', { price: perMonth }),
    join: leadsWithYear
      ? t(locale, 'landing.clubJoinYear', { price: year })
      : t(locale, 'app.marathonJoinCta', { price: perMonth }),
    charge: t(locale, 'app.clubChargeNote', { price: year }),
    chargeShort: leadsWithYear
      ? t(locale, 'landing.clubNoAutoRenew')
      : t(locale, 'landing.clubChargeShort', { price: year }),
    monthly: thirty
      ? t(locale, 'landing.clubOr30', { price: formatPrice(locale, thirty.price) })
      : '',
  };
}
