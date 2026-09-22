/**
 * Where one proof stands with the coach.
 *
 * The club runs on trust: proof scores the moment it arrives, and nobody approves anything to make
 * that happen. The coach's part is a second look — he watches the clip and either leaves it alone
 * or rejects that attempt with a comment, which takes the points back until the athlete does the
 * task again («он может наложить reject на это конкретное выполнение и оставить свой комментарий…
 * дальше пользователь может выполнить это задание заново»).
 *
 * That gives a row three states, and both the athlete's card and the coach's feed read them from
 * here rather than each spelling out the same three conditions:
 *
 *   rejected   `voidedAt` is set. Scores nothing, and the athlete is holding a comment.
 *   redone     sent again after a rejection, not looked at since. This is the coach's queue.
 *   standing   everything else — a first attempt, or one he has already let stand.
 *
 * `voidReason` is not a state. It is the coach's last comment and it outlives the rejection it was
 * written for, because after a redo it is the only record of why the proof was sent twice.
 */
import type { MarathonSubmissionRow } from '@/lib/api/types';

/** The part of a proof its standing is decided by. */
export type ReviewableProof = Pick<
  MarathonSubmissionRow,
  'attempt' | 'voidedAt' | 'reviewedAt' | 'voidReason'
>;

export type ProofReviewState = 'rejected' | 'redone' | 'standing';

export function reviewStateOf(proof: ReviewableProof): ProofReviewState {
  if (proof.voidedAt !== null) return 'rejected';
  if (proof.attempt > 1 && proof.reviewedAt === null) return 'redone';
  return 'standing';
}

/** The coach rejected this attempt: it is not scoring, and the athlete owes another go. */
export function isRejected(proof: ReviewableProof): boolean {
  return reviewStateOf(proof) === 'rejected';
}

/**
 * Sent again after a rejection and not seen since — what «Ждут проверки» lists.
 *
 * A first attempt is deliberately never here. Proof counts on arrival, so a queue of everything
 * would be a queue the coach has to clear for the club to work, which is the opposite of the rule.
 */
export function needsCoachLook(proof: ReviewableProof): boolean {
  return reviewStateOf(proof) === 'redone';
}
