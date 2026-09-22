/**
 * The three standings a proof can have with the coach, and the one that is a queue.
 *
 * The rule worth holding here is the negative one: a first attempt is never «ждёт проверки». Proof
 * scores on arrival and the coach approves nothing, so only a rejection he wrote himself can put a
 * row in front of him again.
 */
import { describe, expect, it } from 'vitest';
import { isRejected, needsCoachLook, reviewStateOf, type ReviewableProof } from './review';

const proof = (over: Partial<ReviewableProof> = {}): ReviewableProof => ({
  attempt: 1,
  voidedAt: null,
  reviewedAt: null,
  voidReason: null,
  ...over,
});

describe('where a proof stands with the coach', () => {
  it('leaves a first attempt standing, and out of the queue', () => {
    expect(reviewStateOf(proof())).toBe('standing');
    expect(needsCoachLook(proof())).toBe(false);
    expect(isRejected(proof())).toBe(false);
  });

  it('reads a struck proof as rejected, whatever else the row says', () => {
    const rejected = proof({
      attempt: 2,
      voidedAt: '2026-09-20T10:00:00.000Z',
      voidReason: 'не то видео',
    });
    expect(reviewStateOf(rejected)).toBe('rejected');
    expect(isRejected(rejected)).toBe(true);
    // Not a queue item: he is not waiting on this one, the athlete is.
    expect(needsCoachLook(rejected)).toBe(false);
  });

  it('queues a redo until he has looked at it', () => {
    const redone = proof({ attempt: 2, voidReason: 'не то видео' });
    expect(needsCoachLook(redone)).toBe(true);

    const seen = { ...redone, reviewedAt: '2026-09-20T13:00:00.000Z' };
    expect(reviewStateOf(seen)).toBe('standing');
    expect(needsCoachLook(seen)).toBe(false);
  });

  it('does not treat his old comment as a rejection once the proof is redone', () => {
    // void_reason outlives the void it was written for: it is why this was sent twice.
    const redone = proof({ attempt: 2, voidReason: 'не то видео' });
    expect(isRejected(redone)).toBe(false);
  });
});
