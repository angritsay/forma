/**
 * Guards the one constraint a kicker still carries: it has to be a label, not a sentence.
 *
 * This test was written for a different reason. `.eyebrow` used to set its label in capitals at
 * 0.18em, and the caps were the danger: Cyrillic capitals are near-uniform rectangles, so
 * uppercasing a Russian phrase erased its word silhouette and the tracking pushed it to roughly
 * twice its sentence-case width — a long one wrapped to two lines of shouting on a 390px screen.
 * The escape hatch was a second class, `.eyebrow-sentence`.
 *
 * The owner has since put the whole product in sentence case, `.eyebrow` *is* what the escape
 * hatch was, and the second class is gone. So the typographic emergency is over — and the rule
 * outlives it, because the reason a kicker is short was never only the caps. It marks a section.
 * At 13px in `--muted` it is the quietest thing on the screen, and a quiet paragraph is not a
 * label, it is small print. Keeping the ceiling is what stops the kicker from becoming a place to
 * put a sentence that did not fit anywhere else.
 *
 * What the ceiling no longer does is send anything to a second class, because there is not one.
 * A string too long to be a kicker is not a kicker: set it as body text at the same 13px in
 * `--muted` and let the weight — 400 rather than `.eyebrow`'s 600 — say it is read and not
 * scanned. Four lines moved that way when this class merged.
 *
 * The test reads the source rather than a hand-maintained list, so adding a long label to an
 * eyebrow fails here rather than in review — or, worse, silently on someone's phone.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dict as en } from './en/index';
import { dict as ru } from './ru/index';

/**
 * 29 characters — the same budget as before, re-measured against the face that renders now.
 *
 * The budget itself has not moved and is the actual rule: **about 210px, a little over half of a
 * 390px screen, is the most a kicker may take before it stops reading as a label.** What changed
 * is what 210px buys. At 11px in capitals tracked 0.18em, Onest's Cyrillic averaged ~9.5px of
 * advance and 210px was 22 characters. At 13px sentence case it averages 7.03px — measured
 * against `scripts/seo/fonts/Onest-Regular.ttf`, summing `hmtx` advances over a Russian sample —
 * and 210px is 29.
 *
 * The number is derived rather than tuned, and the check is worth having at either value:
 * «Образование и сертификаты» is a three-word kicker and sets 181px, «Правила, по которым это
 * считается» is a sentence with a comma in it and sets 224px. 29 is where those two fall apart.
 */
const MAX_KICKER_CHARS = 29;

const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx|astro)$/.test(name) ? [path] : [];
  });
}

/**
 * Keys of every `t('…')` / `t(locale, '…')` rendered directly inside an element whose class list
 * contains `eyebrow`. Deliberately narrow: it matches the literal shape the codebase uses and
 * ignores anything indirect, so it under-reports rather than producing false failures.
 */
function eyebrowKeys(): Set<string> {
  // The `(?!-)` lookahead outlived `.eyebrow-sentence`, the hyphenated opt-out it was written to
  // exclude. It stays: a hyphen is a word boundary, so `\beyebrow\b` would silently swallow any
  // future `eyebrow-*` variant into this rule rather than leaving it to its own.
  const pattern =
    /(?:class|className)=(?:"|\{["'`])[^"'`]*\beyebrow\b(?!-)[^"'`]*(?:"|["'`]\})[^>]*>\s*\{?\s*t\(\s*(?:locale,\s*)?'([a-zA-Z0-9_.]+)'/g;
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    for (const m of readFileSync(file, 'utf8').matchAll(pattern)) keys.add(m[1]!);
  }
  return keys;
}

function lookup(dict: unknown, key: string): string | undefined {
  const [ns, name] = key.split('.');
  if (!ns || !name) return undefined;
  const table = (dict as Record<string, Record<string, string> | undefined>)[ns];
  return table?.[name];
}

describe('kickers', () => {
  const keys = [...eyebrowKeys()].sort();

  it('finds the eyebrow labels in the source', () => {
    // A regex that silently stops matching would make every assertion below vacuous.
    expect(keys.length).toBeGreaterThan(10);
  });

  it.each([
    ['ru', ru],
    ['en', en],
  ])('are short enough to read as a label (%s)', (locale, dict) => {
    const tooLong = keys
      .map((key) => [key, lookup(dict, key)] as const)
      .filter((pair): pair is readonly [string, string] => typeof pair[1] === 'string')
      .filter(([, value]) => value.length > MAX_KICKER_CHARS)
      .map(([key, value]) => `${key} (${value.length} chars, ${locale}): "${value}"`);

    expect(
      tooLong,
      `A kicker marks a section; these read as sentences.\n` +
        `Shorten them to two or three words, or set them as body text instead:\n  ${tooLong.join('\n  ')}`,
    ).toEqual([]);
  });
});
