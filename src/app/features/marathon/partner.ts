/**
 * Where the other half of the pair has got to on today's task — the one sentence the duo club's
 * card says about somebody else.
 *
 * The API has carried this since the first paired marathon (`MarathonTodayTask.teammatesDone`,
 * `entrySize`) and the club stopped drawing it when the club went solo («Каждый сам за себя»).
 * The duo club (0033) brings the pair back, and with it the owner's «belonging / mild pressure»
 * moment of the loop: «Аня уже сделала ✓ — твоя очередь» is a nudge no notification can match,
 * because it is true and it is about a person you chose or were given this week.
 *
 * Pure, so the three sentences are decided in node and `ClubPartnerLine` only draws them.
 */
import type { MarathonTodayTask } from '@/lib/api/types';

export type PartnerState =
  /** The partner delivered and I have not. */
  | 'partner-done'
  /** The partner has not delivered (whether or not I have). */
  | 'partner-waiting'
  /** Both proofs are in. */
  | 'both';

/** Null when there is no partner scored with me on this task — a solo entry, or a pair of one. */
export function partnerState(
  item: Pick<MarathonTodayTask, 'mine' | 'teammatesDone' | 'entrySize'>,
): PartnerState | null {
  if (item.entrySize < 2) return null;
  const meDone = Boolean(item.mine && !item.mine.voidedAt);
  const mateDone = item.teammatesDone.length > 0;
  if (meDone && mateDone) return 'both';
  if (mateDone) return 'partner-done';
  return 'partner-waiting';
}
