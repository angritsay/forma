/**
 * URL helpers that respect the Astro base path (GitHub Pages project sites) and locale prefixes.
 */
import { DEFAULT_LOCALE, type Locale, LOCALES } from '@/content/locales';

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

/**
 * `getStaticPaths` entries for every published locale: the default one renders without a prefix.
 * Pages call this instead of listing languages, so publishing one more is a change in one place
 * (LOCALES in src/content/locales.ts) rather than in every page.
 */
export function localeStaticPaths(): { params: { lang: string | undefined } }[] {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
  }));
}

/** What a site link can tell the app about the visit; read by src/app/features/entry/params.ts. */
export interface AppHrefOptions {
  /** The language of the page the link is on: the app adopts it if the person never chose one. */
  locale?: Locale;
  /** A referral code (0051), set aside until the person is signed in. */
  ref?: string;
}

/**
 * Path to the app, optionally with a hash route: appHref('#/courses') or appHref('/start').
 *
 * The route may be written with or without its `#`. Without `opts` the output is exactly what it
 * always was for the `'#/…'` and `''` forms every older caller uses. With them, the facts go in
 * the query string *before* the hash — `/app/?lang=en#/start` — because everything after `#`
 * belongs to the app's router, and the app reads the query once and clears it.
 */
export function appHref(hashRoute = '', opts?: AppHrefOptions): string {
  const route = hashRoute.replace(/^#/, '');
  const hash = route ? `#${route}` : '';
  if (!opts) return `${withBase('/app/')}${hash}`;
  const q = new URLSearchParams();
  if (opts.locale) q.set('lang', opts.locale);
  if (opts.ref) q.set('ref', opts.ref);
  const query = q.toString();
  return `${withBase('/app/')}${query ? `?${query}` : ''}${hash}`;
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
