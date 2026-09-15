/**
 * The loading wordmark is written down in three places that have to agree, and none of them can
 * see the other two: the React component, the hand-written copy in the pre-hydration screen (which
 * cannot import the component — it is standing in for the bundle), and the CSS that animates
 * whatever markup arrives. Nothing here fails loudly when they drift. A letter dropped from the
 * Astro copy just renders «FORA» for the first second of the app; a missing `animation-delay`
 * leaves two letters in phase and quietly turns the travelling crest back into the blinking block
 * it was replaced for; a `data-reserve` copy that stops being pinned at 800 brings back the
 * sideways squirm the fixed columns exist to prevent.
 *
 * So this reads the three files as text and holds them to each other, the way tile.test.ts holds
 * the marathon colour in CSS to the one in TypeScript.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const component = read('./LogoLoader.tsx');
const fallback = read('../../pages/app/index.astro');
const css = read('../../styles/global.css');

/** `['F', 'wordmark-f']` / `['O', undefined]` from the component. */
const componentLetters = [...component.matchAll(/\['([A-Z])', (?:'([^']+)'|undefined)\]/g)].map(
  (m) => [m[1], m[2]] as const,
);

/** `{ char: 'F', cls: 'wordmark-f' }` / `{ char: 'O', cls: undefined }` from the Astro page. */
const fallbackLetters = [
  ...fallback.matchAll(/\{ char: '([A-Z])', cls: (?:'([^']+)'|undefined) \}/g),
].map((m) => [m[1], m[2]] as const);

describe('the loading wordmark', () => {
  it('spells FORMA in the component, letter by letter', () => {
    expect(componentLetters.map(([char]) => char).join('')).toBe('FORMA');
  });

  it('is spelled identically in the pre-hydration screen', () => {
    // Same letters *and* same classes: the F keeps its ×1.22 stretch and MA stay light, so the
    // handover from the static screen to BootScreen does not visibly re-set the mark.
    expect(fallbackLetters).toEqual(componentLetters);
  });

  it('gives every letter its own place in the wave', () => {
    const delays = [1, 2, 3, 4, 5].map((n) => {
      const rule = new RegExp(
        `\\.wordmark-wave > \\*:nth-child\\(${n}\\)\\s*\\{\\s*animation-delay:\\s*([^;]+);`,
      ).exec(css);
      return rule?.[1].trim();
    });
    // One rule per letter — a letter with no rule inherits 0s and lands on top of the fifth.
    expect(delays.every(Boolean)).toBe(true);
    expect(new Set(delays).size).toBe(componentLetters.length);
  });

  it('holds each column open at the heaviest weight', () => {
    expect(css).toMatch(
      /\.wordmark-wave > \* > \[data-reserve\]\s*\{[^}]*font-variation-settings:\s*'wght'\s*800/,
    );
  });

  it('sets the letters after .wordmark-f, which is what makes the F a grid too', () => {
    // Equal specificity, so source order decides. If `.wordmark-f` is ever moved below, its
    // `display: inline-block` wins on the F alone and only that letter stops reserving its column.
    expect(css.indexOf('.wordmark-f {')).toBeLessThan(css.indexOf('.wordmark-wave > * {'));
  });

  it('rests the mark when motion is reduced', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{[^}]*\.wordmark-wave > \*[^}]*\}/s;
    expect(css).toMatch(reduced);
  });
});
