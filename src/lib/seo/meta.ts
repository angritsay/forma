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

const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Cut at a word boundary so the result is ≤ `max` chars; strips dangling punctuation.
 * A word that ends exactly at the cut (followed by a space or punctuation) is kept.
 */
export function truncateWords(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  const chars = [...s];
  if (chars.length <= max) return s;
  const head = chars.slice(0, max).join('');
  const next = chars[max] ?? '';
  const splitsWord = WORD_CHAR.test(next) && WORD_CHAR.test(chars[max - 1] ?? '');
  const whole = splitsWord ? head.replace(/\s+\S*$/, '') : head;
  const cut = whole.replace(/[\s,;:–—-]+$/, '');
  return cut.length > 0 ? cut : head;
}

/** `truncateWords` plus an ellipsis when something was cut (total stays ≤ `max`). */
export function cutWithEllipsis(text: string, max: number): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (charLength(s) <= max) return s;
  const head = truncateWords(s, max - 1);
  return /[.!?…]$/.test(head) ? head : `${head}…`;
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
 * Build a meta description of DESCRIPTION_MIN..DESCRIPTION_MAX chars from prose.
 * Whole sentences first; when they fall short, the candidates in order of preference are:
 * sentences + CTA, prose cut at the budget (with an ellipsis), cut prose + CTA. The first one
 * inside the budget wins; otherwise the longest that fits. Nothing is ever invented — a very
 * short source simply yields a short description (the audit warns below 80 chars).
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
  if (!out) out = cutWithEllipsis(full, max);
  if (charLength(out) >= min) return out;

  const candidates: string[] = [];
  if (cta) candidates.push(`${out} ${cta}`);
  if (charLength(full) > charLength(out)) candidates.push(cutWithEllipsis(full, max));
  if (cta) {
    const head = cutWithEllipsis(full, max - charLength(cta) - 1);
    if (charLength(head) >= 40 && charLength(head) < charLength(full)) {
      candidates.push(`${head} ${cta}`);
    }
  }
  const fitting = candidates.filter((c) => charLength(c) <= max);
  const inRange = fitting.find((c) => charLength(c) >= min);
  if (inRange) return inRange;
  fitting.sort((a, b) => charLength(b) - charLength(a));
  return fitting[0] ?? out;
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
