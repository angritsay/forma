/**
 * Guards the constraint that the uppercase kicker carries.
 *
 * `.eyebrow` (src/styles/global.css) sets its label in capitals at 0.14em tracking. That works on
 * a section marker and fails on a sentence: Cyrillic capitals are near-uniform rectangles, so
 * uppercasing a Russian phrase erases its word silhouette, and the tracking then pushes it to
 * roughly twice the set width of the sentence-case original — on a 390px screen a long one wraps
 * to two lines of shouting. The brandbook accepts that cost for short labels only.
 *
 * So: every i18n string rendered inside an `.eyebrow` must be short. Anything longer belongs in
 * `.eyebrow-sentence`, which occupies the same slot in the hierarchy without the caps.
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
 * Measured against the rendered face: at 11px with 0.14em tracking, Manrope's Cyrillic capitals
 * average ~9px of advance, so 22 characters is ~200px — about half of a 390px screen, which is
 * the most a kicker should take before it stops reading as a label.
 */
const MAX_KICKER_CHARS = 22;

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
  // `\beyebrow\b` alone also matches inside `eyebrow-sentence`, because a hyphen is a word
  // boundary — and that class is precisely the opt-out this rule is about. Hence the lookahead.
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

describe('uppercase kickers', () => {
  const keys = [...eyebrowKeys()].sort();

  it('finds the eyebrow labels in the source', () => {
    // A regex that silently stops matching would make every assertion below vacuous.
    expect(keys.length).toBeGreaterThan(10);
  });

  it.each([
    ['ru', ru],
    ['en', en],
  ])('are short enough to read in caps (%s)', (locale, dict) => {
    const tooLong = keys
      .map((key) => [key, lookup(dict, key)] as const)
      .filter((pair): pair is readonly [string, string] => typeof pair[1] === 'string')
      .filter(([, value]) => value.length > MAX_KICKER_CHARS)
      .map(([key, value]) => `${key} (${value.length} chars, ${locale}): "${value}"`);

    expect(
      tooLong,
      `These are set in capitals at 0.14em tracking and are too long to read that way.\n` +
        `Use "eyebrow-sentence" instead, or shorten the label:\n  ${tooLong.join('\n  ')}`,
    ).toEqual([]);
  });
});
