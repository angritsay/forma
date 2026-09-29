/**
 * The 404 page's second chance: turn a near-miss link into the page it meant.
 *
 * GitHub Pages has no redirects, so every short or slightly wrong link — `/start` typed into an
 * Instagram bio, `/Club`, `/ru/about`, the old `/forma/…` project prefix, `/courses/start/` from an
 * old doc — lands on `404.html`. That page runs `resolveNotFound` inline, before it paints, and
 * leaves with `location.replace` when the path resolves to a real route.
 *
 * Three rules keep it honest:
 * - **Only real routes.** The target must be in `routes`, the list of pages the build emitted
 *   (`notFoundConfig`). An alias to a page that is off (the subscription page while plans are off)
 *   resolves to nothing, and the visitor sees the 404 as before.
 * - **A real page wins over an alias.** `/together/` goes to the homepage block today; once a
 *   `/together/` page ships, the same link reaches it with no change here.
 * - **Never a loop.** A target whose path is the one being shown is refused.
 *
 * `resolveNotFound` is serialised into the page with `Function.prototype.toString`, so it must stay
 * self-contained: no imports, no module-level helpers, nothing a bundler would have to rewrite.
 * `notFoundRedirect.test.ts` runs the serialised copy to prove it.
 */
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/content/schema';
import { SITE_COURSES } from '@/content/published';
import { appHref, BASE } from '@/lib/util/paths';

/** Everything the inline resolver knows, emitted as JSON at build time. */
export interface NotFoundConfig {
  /** The deploy's base path with both slashes, e.g. "/" or "/forma/". */
  base: string;
  /** The default locale, which has no path prefix. */
  defaultLocale: string;
  /** Locales with a prefix (`/en/`); the default one is also accepted as a stray prefix (`/ru/`). */
  locales: string[];
  /** Every real route as a locale-prefixed site path without base: "/", "/en/about/", "/app/". */
  routes: string[];
  /**
   * Per locale: a normalised site path without locale prefix ("/club/") → the target without base
   * ("/subscribe/", "/en/subscribe/", "/app/?lang=en#/start", "/#together").
   */
  aliases: Record<string, Record<string, string>>;
}

/** The parts of `location` the resolver reads. */
export interface NotFoundLocation {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Where a 404'd location should go, as an href with base, query and hash; `null` to stay on the 404.
 *
 * The incoming query (utm, fbclid) is kept, merged after the target's own (the target wins on a
 * shared key, so an alias's `lang` is not overridden by a stray one). The incoming hash is kept
 * unless the target has its own: an app deep link's `#/start` is the whole point of that alias.
 */
export function resolveNotFound(loc: NotFoundLocation, cfg: NotFoundConfig): string | null {
  let p = loc.pathname || '/';
  try {
    p = decodeURI(p);
  } catch {
    // A malformed escape is just an unknown path.
  }
  p = p.toLowerCase().replace(/\/{2,}/g, '/');
  const base = cfg.base.toLowerCase();
  if (base !== '/') {
    if (p === base.slice(0, -1)) p = '/';
    else if (p.indexOf(base) === 0) p = p.slice(base.length - 1);
  }
  if (p === '/forma' || p.indexOf('/forma/') === 0) p = p.slice('/forma'.length) || '/';
  p = p.replace(/\/index\.html?$/, '/').replace(/\.html?$/, '');
  if (p.charAt(p.length - 1) !== '/') p += '/';

  let locale = cfg.defaultLocale;
  let rest = p;
  const m = /^\/([a-z]{2})(\/.*)$/.exec(p);
  if (m && (m[1] === cfg.defaultLocale || cfg.locales.indexOf(m[1] as string) !== -1)) {
    locale = m[1] as string;
    rest = m[2] as string;
  }
  const prefixed = locale === cfg.defaultLocale ? rest : '/' + locale + rest;

  let target: string | null = null;
  if (cfg.routes.indexOf(prefixed) !== -1) target = prefixed;
  else {
    const table = cfg.aliases[locale];
    const alias = table ? table[rest] : undefined;
    if (alias) target = alias;
  }
  if (!target) return null;

  const hashAt = target.indexOf('#');
  const targetHash = hashAt === -1 ? '' : target.slice(hashAt);
  const noHash = hashAt === -1 ? target : target.slice(0, hashAt);
  const queryAt = noHash.indexOf('?');
  const path = queryAt === -1 ? noHash : noHash.slice(0, queryAt);
  if (cfg.routes.indexOf(path) === -1) return null;

  const href = cfg.base + path.slice(1);
  if (href === loc.pathname) return null;

  const query = new URLSearchParams(queryAt === -1 ? '' : noHash.slice(queryAt + 1));
  new URLSearchParams(loc.search).forEach((value, key) => {
    if (!query.has(key)) query.append(key, value);
  });
  const qs = query.toString();
  return href + (qs ? '?' + qs : '') + (targetHash || loc.hash || '');
}

/** An href from `paths.ts` (which carries the base) back to a site path without it. */
function unbased(href: string): string {
  return BASE !== '/' && href.startsWith(BASE) ? `/${href.slice(BASE.length)}` : href;
}

/**
 * Short and old links per locale, keyed by the normalised site path without locale prefix.
 * Targets without base; they are localised here, and checked against the real routes at runtime.
 *
 * To retarget one, change it here — e.g. `/together/` points at the homepage's together block
 * until the `/together/` page ships, and needs no edit then (a real route wins over an alias).
 */
export function notFoundAliases(locale: Locale): Record<string, string> {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  const page = (sitePath: string): string => `${prefix}${sitePath}`;
  const start = SITE_COURSES.find((c) => c.id === 'start');
  const course = start ? page(`/courses/${start.slug[locale]}/`) : page('/courses/');
  return {
    '/start/': unbased(appHref('/start', { locale })),
    // `/app/` itself is a real route; this is for `/en/app`, which should open the app in English.
    '/app/': unbased(appHref('', { locale })),
    '/club/': page('/subscribe/'),
    '/coach/': page('/about/'),
    '/trainer/': page('/about/'),
    '/together/': `${page('/')}#together`,
    '/courses/start/': course,
    '/course/': course,
    '/kurs/': course,
  };
}

/** The resolver's config from the build's page list (`allPages()` paths). `/app/` is added here. */
export function notFoundConfig(pagePaths: readonly string[]): NotFoundConfig {
  const routes = [...new Set([...pagePaths, '/app/'])].sort();
  const aliases: Record<string, Record<string, string>> = {};
  for (const locale of LOCALES) aliases[locale] = notFoundAliases(locale);
  return {
    base: BASE,
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES.filter((l) => l !== DEFAULT_LOCALE),
    routes,
    aliases,
  };
}

/**
 * The inline script for 404.astro: the resolver's own source plus the config, run at once.
 * `<` is escaped so no route or alias can close the script element.
 */
export function notFoundScript(cfg: NotFoundConfig): string {
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  return `(function(){try{var t=(${resolveNotFound.toString()})(location,${json});if(t)location.replace(t);}catch(e){}})();`;
}
