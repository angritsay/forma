/**
 * Split a heading into its lead and its key word — the last word — for the hero field's device
 * (a light-blue word with a hand-drawn underline, `KeyWord` in src/components/ui/HeroField.tsx).
 *
 * The last word is the key word because Russian headings in this product put the news at the end —
 * «Форма с нуля», «Присед без боли», «Час с тренером» — and a rule that needs no markup in the copy
 * is one a translator cannot break. The lead keeps its trailing space so the two halves render as
 * the original string.
 *
 * Trailing punctuation stays with the key word («нуля.»), and a word glued to the one before it by
 * a no-break space («60\u00a0сек») comes along with it: that space is the author saying the two are
 * one unit. A single-word heading has no lead and is all key word; an empty one returns `['', '']`.
 */
export function splitKeyWord(text: string): [lead: string, key: string] {
  const trimmed = text.replace(/\s+$/u, '');
  const at = trimmed.search(/[ \t\n\r][^ \t\n\r]*$/u);
  if (at < 0) return ['', trimmed];
  return [trimmed.slice(0, at + 1), trimmed.slice(at + 1)];
}
