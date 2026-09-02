/**
 * Pricing, currency display and policy constants. Owner-editable.
 *
 * Prices themselves live on each course (`course.price = { rub, usd }`); this file decides which
 * currency a locale sees and holds the numbers the legal pages and the FAQ interpolate.
 */
import type { Locale } from '@/content/schema';

export type Currency = 'rub' | 'usd';
export type CurrencyCode = 'RUB' | 'USD';

export const PRICING = {
  /** Which price a visitor sees, by site language. */
  currencyByLocale: { ru: 'rub', en: 'usd' } as Record<Locale, Currency>,
  /** ISO 4217 codes for schema.org offers and Intl formatting. */
  currencyCode: { rub: 'RUB', usd: 'USD' } as Record<Currency, CurrencyCode>,
  /** Refund window, in days after the coach activates access. */
  refundDays: 14,
  /**
   * A refund is possible while fewer than this many workouts of the course are completed
   * (see /refund/ and docs/LEGAL.md).
   */
  refundMaxCompletedWorkouts: 3,
  /** Shown as "Last updated" on /privacy/, /terms/ and /refund/ (ISO date). */
  legalUpdatedAt: '2026-09-02',
  /** Supabase project region, named in the privacy policy. Match the region chosen in Supabase. */
  dataRegion: 'eu' as 'eu' | 'us',
  /** Minimum age to use the service, stated in the terms and the privacy policy. */
  minimumAge: 18,
  /** Notice period (days) before the service is discontinued, promised in the terms. */
  shutdownNoticeDays: 30,
} as const;

export interface CoursePrice {
  rub: number;
  usd: number;
}

/** The amount + ISO currency a locale should display / declare in JSON-LD. */
export function priceForLocale(
  price: CoursePrice,
  locale: Locale,
): { amount: number; currency: CurrencyCode } {
  const currency = PRICING.currencyByLocale[locale];
  return { amount: price[currency], currency: PRICING.currencyCode[currency] };
}

/** "4 990 ₽" for ru, "$49" for en. Whole units — prices are authored without cents. */
export function formatPrice(locale: Locale, price: CoursePrice): string {
  const { amount, currency } = priceForLocale(price, locale);
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** True when the course is free in the visitor's currency. */
export function isFree(price: CoursePrice, locale: Locale): boolean {
  return priceForLocale(price, locale).amount === 0;
}
