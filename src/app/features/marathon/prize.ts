/**
 * What the week is played for, in the words the product uses everywhere.
 *
 * The prize is a column on the marathon row, so the coach can name something else for one round —
 * and it is empty far more often than it is filled, because the answer is almost always the same
 * one. Left to the data, an unfilled column meant the pill simply disappeared and the board became
 * a table of numbers with nothing at the top of it.
 *
 * So the copy carries the standing prize and the row overrides it: **час с тренером и создателем
 * Forma**. He is sold as both from here on — the owner's own instruction — and saying it once, in
 * `app.marathonPrizeDefault`, is what keeps the member's board, the full board and the selling
 * screen from drifting into three different promises.
 */
import type { Translator } from '@/app/hooks/useT';

export function clubPrize(tr: Translator, prize: string | null | undefined): string {
  const named = prize?.trim();
  return named ? named : tr.t('app.marathonPrizeDefault');
}

/**
 * The same prize, dropped into the middle of a sentence.
 *
 * The selling screen's second paragraph ends «…достаётся час с тренером и создателем Forma», which
 * is the standing prize in lower case. Writing those words out again there would be the third copy
 * of a promise this file exists to keep at one, and the two would drift the first time the prize
 * changed — so the one string is lowered by its first character instead. `toLocaleLowerCase` so
 * that a locale with its own casing rules keeps them; the rest of the string is untouched, which
 * leaves «Forma» alone.
 */
export function clubPrizeMidSentence(tr: Translator, prize?: string | null): string {
  const text = clubPrize(tr, prize);
  return text.charAt(0).toLocaleLowerCase(tr.locale) + text.slice(1);
}
