/**
 * The self-test survives a reload: answers and phase are kept for the tab, a resumed run opens on
 * the first unanswered movement, and benchmark records that fail are named rather than dropped.
 */
import { describe, expect, it } from 'vitest';
import { ASSESSMENT_MOVES } from '@content/site/assessment';
import {
  ASSESSMENT_DRAFT_KEY,
  answeredCount,
  clearAssessmentDraft,
  firstUnanswered,
  readAssessmentDraft,
  writeAssessmentDraft,
} from './draft';
import { emptyAnswers, recordAssessmentBenchmarks } from './model';

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const [first, second] = ASSESSMENT_MOVES as unknown as [
  { exerciseId: string },
  { exerciseId: string },
];

describe('assessment draft', () => {
  it('reads back the phase and the answers it wrote', () => {
    const store = memory();
    const answers = { counts: { [first.exerciseId]: 12 }, onKnees: true };
    writeAssessmentDraft({ phase: 'running', answers }, store);
    expect(readAssessmentDraft(store)).toEqual({ phase: 'running', answers });
  });

  it('is gone after a deliberate close or a save', () => {
    const store = memory();
    writeAssessmentDraft({ phase: 'done', answers: emptyAnswers() }, store);
    clearAssessmentDraft(store);
    expect(readAssessmentDraft(store)).toBeNull();
  });

  it('drops a malformed or tampered value instead of trusting it', () => {
    const store = memory();
    store.setItem(ASSESSMENT_DRAFT_KEY, '{"phase":"nope","answers":{"counts":{}}}');
    expect(readAssessmentDraft(store)).toBeNull();
    store.setItem(
      ASSESSMENT_DRAFT_KEY,
      JSON.stringify({ phase: 'intro', answers: { counts: { a: -1, b: 'x', c: 4 } } }),
    );
    expect(readAssessmentDraft(store)?.answers.counts).toEqual({ c: 4 });
  });

  it('resumes on the first movement without a number', () => {
    expect(firstUnanswered(emptyAnswers())).toBe(0);
    const answers = { counts: { [first.exerciseId]: 10 }, onKnees: false };
    expect(firstUnanswered(answers)).toBe(1);
    expect(answeredCount(answers)).toBe(1);
    expect(answeredCount({ counts: { [second.exerciseId]: 3, junk: 1 }, onKnees: false })).toBe(1);
  });
});

describe('recordAssessmentBenchmarks', () => {
  it('names the records that did not save', async () => {
    const failed = await recordAssessmentBenchmarks({ a: 1, b: 2, c: 3 }, async (key) => {
      if (key === 'b') throw new Error('offline');
    });
    expect(failed).toEqual(['b']);
  });
});
