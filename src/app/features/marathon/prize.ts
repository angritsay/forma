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
