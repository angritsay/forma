/**
 * The self-test in progress, kept for the tab (`sessionStorage`).
 *
 * Five movements take a few minutes, and a Mini App is reloaded by the phone whenever it likes —
 * a call, a switch to the camera, low memory. The answers lived in component state, so any of
 * those put the athlete back at movement one with nothing counted. They are written here on every
 * answer and read back on mount; saving the result or closing the test on purpose removes them.
 *
 * sessionStorage rather than localStorage: a half-done test is this visit's business, and one
 * found a week later on the same phone would be numbers from a different day.
 *
 * Pure module, no React: tested in node with an in-memory store.
 */
import { ASSESSMENT_MOVES } from '@content/site/assessment';
import type { AssessmentAnswers } from './model';

export const ASSESSMENT_DRAFT_KEY = 'forma.assessmentDraft';

export type AssessmentPhase = 'intro' | 'running' | 'done';

export interface AssessmentDraft {
  phase: AssessmentPhase;
  answers: AssessmentAnswers;
  /**
   * The profile is saved and these benchmark keys are not. Kept so a reload offers the retry for
   * just these, rather than «Сохранить» again — which would record the ones that landed twice.
   */
  failedKeys?: string[];
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function sessionStore(): StorageLike | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

const PHASES: readonly AssessmentPhase[] = ['intro', 'running', 'done'];

export function readAssessmentDraft(store = sessionStore()): AssessmentDraft | null {
  if (!store) return null;
  try {
    const raw = store.getItem(ASSESSMENT_DRAFT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<AssessmentDraft>;
    const a = v.answers as Partial<AssessmentAnswers> | undefined;
    if (!v.phase || !PHASES.includes(v.phase) || !a || typeof a.counts !== 'object' || !a.counts) {
      return null;
    }
    const counts: Record<string, number> = {};
    for (const [k, n] of Object.entries(a.counts)) {
      if (typeof n === 'number' && Number.isFinite(n) && n >= 0) counts[k] = n;
    }
    const failedKeys = Array.isArray(v.failedKeys)
      ? v.failedKeys.filter((k): k is string => typeof k === 'string')
      : [];
    return {
      phase: v.phase,
      answers: { counts, onKnees: a.onKnees === true },
      ...(failedKeys.length > 0 ? { failedKeys } : {}),
    };
  } catch {
    return null;
  }
}

export function writeAssessmentDraft(draft: AssessmentDraft, store = sessionStore()): void {
  try {
    store?.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Full or blocked storage: the test still runs, it just does not survive a reload. */
  }
}

export function clearAssessmentDraft(store = sessionStore()): void {
  try {
    store?.removeItem(ASSESSMENT_DRAFT_KEY);
  } catch {
    /* Nothing to clean. */
  }
}

/** Where a resumed run picks up: the first movement without a number, never past the last. */
export function firstUnanswered(answers: AssessmentAnswers): number {
  const i = ASSESSMENT_MOVES.findIndex((m) => answers.counts[m.exerciseId] === undefined);
  return i < 0 ? ASSESSMENT_MOVES.length - 1 : i;
}

/** How many movements already have a number — what closing the test would throw away. */
export function answeredCount(answers: AssessmentAnswers): number {
  return ASSESSMENT_MOVES.filter((m) => answers.counts[m.exerciseId] !== undefined).length;
}
