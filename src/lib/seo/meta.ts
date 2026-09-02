/**
 * Title / description generators and OG image path helpers for programmatic pages.
 * Pure string functions except `ogImagePath`, which checks public/og at build time.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Exercise, Locale } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { BRAND } from '@content/site/brand';

/** Full <title> budget including the " — Forma" suffix that SeoHead appends. */
export const TITLE_MAX = 60;
export const TITLE_SUFFIX = ` — ${BRAND.name}`;
/** Budget for the page-specific part of the title. */
export const TITLE_BUDGET = TITLE_MAX - TITLE_SUFFIX.length;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

/** Length in Unicode code points (what search engines count, not UTF-16 units). */
export function charLength(s: string): number {
  return [...s].length;
}

/** Cut at a word boundary so the result is ≤ `max` chars; strips dangling punctuation. */
export function truncateWords(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (charLength(s) <= max) return s;
  const head = [...s].slice(0, max).join('');
  const cut = head.replace(/\s+\S*$/, '').replace(/[\s,;:–—-]+$/, '');
  return cut.length > 0 ? cut : head;
}

/** First candidate that fits the budget; otherwise the last one cut at a word boundary. */
export function fitTitle(candidates: string[], max = TITLE_BUDGET): string {
  for (const c of candidates) if (charLength(c.trim()) <= max) return c.trim();
  return truncateWords(candidates[candidates.length - 1] ?? '', max);
}

/** Split prose into sentences, keeping the terminal punctuation. */
export function sentences(text: string): string[] {
  const norm = text.replace(/\s+/g, ' ').trim();
  const parts = norm.match(/[^.!?…]+[.!?…]+["»)]?|[^.!?…]+$/g) ?? [];
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Build a meta description of DESCRIPTION_MIN..DESCRIPTION_MAX chars from prose:
 * whole sentences first; when too short, extend with the next partial sentence or append the
 * CTA sentence, whichever keeps the result inside the budget.
 */
export function buildDescription(
  text: string,
  cta = '',
  min = DESCRIPTION_MIN,
  max = DESCRIPTION_MAX,
): string {
  const full = text.replace(/\s+/g, ' ').trim();
  let out = '';
  for (const s of sentences(full)) {
    const next = out ? `${out} ${s}` : s;
    if (charLength(next) > max) break;
    out = next;
  }
  if (!out) out = truncateWords(full, max);
  if (charLength(out) >= min) return out;

  const withCta = cta ? `${out} ${cta}` : out;
  if (cta && charLength(withCta) <= max && charLength(withCta) >= min) return withCta;
  if (charLength(full) > charLength(out)) {
    const extended = truncateWords(full, max);
    if (charLength(extended) >= min) return extended;
  }
  if (cta) {
    const room = max - charLength(cta) - 1;
    const head = truncateWords(full, room);
    if (charLength(head) >= 40) return `${head} ${cta}`;
    return charLength(withCta) <= max ? withCta : truncateWords(withCta, max);
  }
  return out;
}

export function exerciseTitle(ex: Exercise, locale: Locale): string {
  const name = l(ex.name, locale);
  return fitTitle([
    t(locale, 'seo.exerciseTitleFull', { name }),
    t(locale, 'seo.exerciseTitleMedium', { name }),
    t(locale, 'seo.exerciseTitleShort', { name }),
    name,
  ]);
}

export function exerciseDescription(ex: Exercise, locale: Locale): string {
  return buildDescription(l(ex.description, locale), t(locale, 'seo.exerciseDescriptionCta'));
}

/** Reading time at a conservative pace (RU text is denser per word). */
export function readingTimeMinutes(words: number, locale: Locale): number {
  const wpm = locale === 'ru' ? 160 : 200;
  return Math.max(1, Math.round(words / wpm));
}

export type OgKind = 'exercise' | 'course' | 'guide' | 'hub';

/** Site-relative path of a generated OG image, e.g. "/og/exercise-air_squat-ru.png". */
export function ogImageFile(kind: OgKind, id: string, locale: Locale): string {
  return `/og/${kind}-${id}-${locale}.png`;
}

/**
 * OG image for a page: the generated file when `npm run seo:og` produced it, otherwise the
 * brand default. Checked against public/ at build time so a missing PNG never ships as a 404.
 */
export function ogImagePath(kind: OgKind, id: string, locale: Locale): string {
  const file = ogImageFile(kind, id, locale);
  return publicFileExists(file) ? file : BRAND.ogImage;
}

function publicFileExists(sitePath: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', sitePath));
  } catch {
    return false;
  }
}
