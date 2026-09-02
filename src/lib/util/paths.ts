/**
 * URL helpers that respect the Astro base path (GitHub Pages project sites) and locale prefixes.
 */
import { DEFAULT_LOCALE, type Locale } from '@/content/schema';

/** Base path with leading and trailing slash, e.g. "/" or "/forma/". */
export const BASE: string = normalizeBase(import.meta.env.BASE_URL ?? '/');

function normalizeBase(b: string): string {
  let base = b || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

/** Prefix a site-relative path ("/courses/") with the base path → "/forma/courses/". */
export function withBase(path: string): string {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${clean}`;
}

/** Locale-prefixed site path (without base): localePath('en', '/courses/') → '/en/courses/'. */
export function localePath(locale: Locale, path = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const withSlash = p.endsWith('/') || /\.[a-z0-9]+$/i.test(p) ? p : `${p}/`;
  return locale === DEFAULT_LOCALE ? withSlash : `/${locale}${withSlash}`;
}

/** Locale-prefixed path including the base path → ready for href. */
export function href(locale: Locale, path = '/'): string {
  return withBase(localePath(locale, path));
}

/** Path to the app, optionally with a hash route: appHref('#/courses'). */
export function appHref(hashRoute = ''): string {
  return `${withBase('/app/')}${hashRoute}`;
}

/** Strip base + locale prefix from a pathname → site path and locale. */
export function parsePath(pathname: string): { locale: Locale; path: string } {
  let p = pathname;
  if (BASE !== '/' && p.startsWith(BASE)) p = `/${p.slice(BASE.length)}`;
  const m = p.match(/^\/(en)(\/|$)/);
  if (m) {
    const rest = p.slice(3) || '/';
    return { locale: 'en', path: rest.startsWith('/') ? rest : `/${rest}` };
  }
  return { locale: 'ru', path: p || '/' };
}

/** Absolute URL for canonical/OG tags. `site` must be the origin (+ base if any). */
export function absoluteUrl(site: string, localePathValue: string): string {
  const origin = site.replace(/\/$/, '');
  const base = BASE === '/' ? '' : BASE.replace(/\/$/, '');
  const originHasBase = base && origin.endsWith(base);
  return `${origin}${originHasBase ? '' : base}${localePathValue}`;
}
