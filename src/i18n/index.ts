/**
 * Lightweight typed i18n.
 *
 * Dictionaries are split by namespace (common, landing, app, training, seo); each namespace file
 * exports a flat object of dot-free keys. The EN dictionary is the source of truth for the key set;
 * a test enforces RU/EN parity.
 *
 *   t('ru', 'app.home.title')            → 'Главная'
 *   t('en', 'common.minutesShort', {n})  → '{n} min' with interpolation
 */
import { DEFAULT_LOCALE, LOCALES, type L10n, type Locale } from '@/content/schema';
import * as en from './en/index';
import * as ru from './ru/index';

export { DEFAULT_LOCALE, LOCALES, type Locale };

type EnDict = typeof en.dict;
/** Structural dictionary type: same namespaces/keys as EN, string values. */
type Dict = { [N in keyof EnDict]: { [K in keyof EnDict[N]]: string } };
export type Namespace = keyof Dict;
export type TKey = { [N in Namespace]: `${N & string}.${keyof Dict[N] & string}` }[Namespace];

// Assigning ru.dict to Dict is a compile-time parity check: a key missing in RU fails `astro check`.
const DICTS: Record<Locale, Dict> = { en: en.dict, ru: ru.dict };

export type TParams = Record<string, string | number>;

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

export function t(locale: Locale, key: TKey, params?: TParams): string {
  const dot = key.indexOf('.');
  const ns = key.slice(0, dot) as Namespace;
  const k = key.slice(dot + 1);
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  const nsDict = dict[ns] as Record<string, string> | undefined;
  const fallback = (DICTS.en[ns] as Record<string, string> | undefined)?.[k];
  const value = nsDict?.[k] ?? fallback ?? key;
  return interpolate(value, params);
}

/** Pick a localized string from a content L10n object. */
export function l(value: L10n | undefined | null, locale: Locale): string {
  if (!value) return '';
  return value[locale] || value[DEFAULT_LOCALE] || value.en || '';
}

export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (LOCALES as readonly string[]).includes(x);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ru' ? 'en' : 'ru';
}

/** Detect the preferred locale from the browser, falling back to the default. */
export function detectLocale(navigatorLanguages?: readonly string[]): Locale {
  const langs = navigatorLanguages ?? (typeof navigator !== 'undefined' ? navigator.languages : []);
  for (const lang of langs) {
    const base = lang.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Plural helper: pick a form by count. RU has 3 forms (1, 2-4, 5+), EN has 2. */
export function plural(
  locale: Locale,
  n: number,
  forms: { one: string; few?: string; many: string },
): string {
  const abs = Math.abs(n);
  if (locale === 'ru') {
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return forms.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few ?? forms.many;
    return forms.many;
  }
  return abs === 1 ? forms.one : forms.many;
}

/** Locale-aware date formatting (short: "12 Sep", long: "12 September 2026"). */
export function formatDate(locale: Locale, iso: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', opts).format(d);
}

export function formatNumber(locale: Locale, n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatDuration(locale: Locale, totalSec: number): string {
  const min = Math.round(totalSec / 60);
  if (min < 60) return t(locale, 'common.minutesShort', { n: min });
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0
    ? t(locale, 'common.hoursShort', { n: h })
    : `${t(locale, 'common.hoursShort', { n: h })} ${t(locale, 'common.minutesShort', { n: m })}`;
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
