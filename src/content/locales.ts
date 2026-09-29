/**
 * The locale lists, on their own so a browser script can read them without zod.
 *
 * `schema.ts` re-exports everything here. A site script that imports `@/content/schema` for a
 * *value* (not only a type) runs its `z.object(...)` calls and ships zod (~55 KB) to every static
 * page — `paths.ts`, which every page script uses, imports from this file instead
 * (`bundle.test.ts` checks the built site).
 */

/**
 * Languages content is *authored* in. Every L10n value carries all of them, so a translation is
 * never lost and adding a language back is a one-line change to LOCALES below.
 */
export const AUTHORED_LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof AUTHORED_LOCALES)[number];

/**
 * Languages the product is *published* in: what the site renders and links, what the sitemap and
 * hreflang list, and what the app offers.
 *
 * Both are served. Russian is the default and keeps the bare paths (`/courses/`); English lives
 * under `/en/`. `scripts/seo/lib.mjs` and `scripts/seo/og.mjs` carry their own copy of this list
 * because they run as plain Node without the TypeScript path aliases — they have to be changed
 * together with this line.
 */
export const LOCALES: readonly Locale[] = ['ru', 'en'];
export const DEFAULT_LOCALE: Locale = 'ru';
