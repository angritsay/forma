/**
 * Canonical/alternate URL helpers for SEO tags and sitemaps.
 * A "site path" is locale-agnostic ("/courses/start/"); locale prefixes and the base path
 * are applied here.
 */
import { LOCALES, type Locale } from '@/content/schema';
import { absoluteUrl, localePath } from '@/lib/util/paths';

export interface Alternate {
  locale: Locale | 'x-default';
  href: string;
}

/** Absolute canonical URL for a locale + site path. */
export function canonicalUrl(site: string, locale: Locale, sitePath: string): string {
  return absoluteUrl(site, localePath(locale, sitePath));
}

/**
 * hreflang alternates. `localizedPaths` maps a locale to its site path when slugs differ
 * per locale (exercises, courses); when omitted the same path is used for every locale.
 * x-default points at the default locale (ru).
 *
 * With a single published language there is nothing to alternate between, and a lone
 * self-referencing hreflang is noise a crawler should not have to read: the list is empty, and
 * fills itself again the moment LOCALES grows.
 */
export function alternates(
  site: string,
  sitePath: string,
  localizedPaths?: Partial<Record<Locale, string>>,
): Alternate[] {
  if (LOCALES.length < 2) return [];
  const out: Alternate[] = [];
  for (const loc of LOCALES) {
    const p = localizedPaths?.[loc];
    if (localizedPaths && !p) continue; // page does not exist in this locale
    out.push({ locale: loc, href: canonicalUrl(site, loc, p ?? sitePath) });
  }
  const ru = out.find((a) => a.locale === 'ru') ?? out[0];
  if (ru) out.push({ locale: 'x-default', href: ru.href });
  return out;
}

export function ogLocale(locale: Locale): string {
  return locale === 'ru' ? 'ru_RU' : 'en_US';
}

/** BCP-47 tag for `inLanguage` / `<html lang>`-style consumers. */
export function langTag(locale: Locale): string {
  return locale === 'ru' ? 'ru-RU' : 'en-US';
}

/**
 * Site origin (no trailing slash) from `Astro.site` / an endpoint's `context.site`.
 * Falls back to localhost for local builds without SITE_URL, like SeoHead does.
 */
export function siteOrigin(site: URL | string | undefined): string {
  return (site ? site.toString() : 'http://localhost:4321').replace(/\/$/, '');
}
