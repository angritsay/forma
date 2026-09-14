/**
 * Stars: what a finished session was worth, and the reason to come back to it.
 *
 * The rule the owner set: «полегче» puts one star up, «нормально» two, «посложнее» three, and how
 * much of the workout was actually done fills them. So going back to a day you took easy, and
 * taking it harder, is worth something — which is the whole point.
 *
 * Three decisions carry it, and each one is here because the obvious version was wrong.
 *
 * **Only the main work fills a star.** The warm-up and the cool-down are excluded outright. That
 * is not a shortcut, it is the coach's own line — «Разминка не входит в тренировку, это
 * подготовка» — and it is what makes the skip controls honest: on a beginner session those two
 * blocks are 64% of the time, so counting them would mean skipping a warm-up costs two thirds of
 * the score. Skipping preparation is free. Skipping the work is not.
 *
 * **It does not touch `completion`.** The session's stored completion drives the course scale, the
 * next difficulty recommendation and the points, over every row already in the database. Stars are
 * a second, separate reading of the same results, so nothing about how hard the engine thinks you
 * trained changes on the day this ships.
 *
 * **A test is not graded.** A benchmark and a baseline are identical at every difficulty by
 * construction (`src/content/course-load.test.ts`), so a choice made on them costs nothing and
 * would hand out the cheapest three stars in the product. You do not get marked for sitting an
 * exam; those nodes carry no stars at all.
 */
import { blockSection } from '@/app/features/player/model';
import type { NodeKind } from '@/content/schema';
import { buildPlayerSteps } from './player';
import { stepCompletion, stepWeightSec } from './session';
import type { DifficultyChoice, ExerciseResult, PrescribedWorkout } from './types';
import { clamp, num, round2 } from './util';

/** Three, and the interface draws three whatever the choice put up. */
export const STARS_MAX = 3;

/** How many stars each choice puts on offer. The owner's rule, verbatim. */
export const STARS_ON_OFFER: Readonly<Record<DifficultyChoice, number>> = {
  easier: 1,
  normal: 2,
  harder: 3,
};

/**
 * Node kinds that earn stars. A rest day has no session; a test and a benchmark are measurements.
 */
export function nodeEarnsStars(kind: NodeKind): boolean {
  return kind === 'workout';
}

/**
 * The share of the main work that was done, 0..1.
 *
 * Weighted by each step's own seconds, exactly as `computeCompletion` weights a whole session —
 * the same arithmetic, over a smaller set of steps, so the two numbers can never disagree about
 * what a step was worth.
 *
 * **Where the main work is a single block, this is 0 or 1 and nothing in between.** Thirteen of
 * the twenty sessions in the beginner course are one piece against a clock, and the player runs
 * such a piece as one step rather than one step per movement — so there is no "how many movements
 * did you get through" to read. The owner's call was that the star should light whole there
 * rather than pretend to a precision the session does not have.
 */
export function workDone(
  prescribed: PrescribedWorkout,
  results: readonly ExerciseResult[],
): number {
  const steps = buildPlayerSteps(prescribed);
  const mainBlocks = new Set(
    prescribed.blocks.filter((b) => blockSection(b.type) === 'main').map((b) => b.blockId),
  );
  const byIndex = new Map<number, ExerciseResult>();
  for (const r of results) byIndex.set(r.stepIndex, r);

  let total = 0;
  let weighted = 0;
  steps.forEach((step, i) => {
    const blockId = 'blockId' in step ? step.blockId : undefined;
    if (!blockId || !mainBlocks.has(blockId)) return;
    const w = num(stepWeightSec(step));
    if (w <= 0) return;
    total += w;
    weighted += w * clamp(num(stepCompletion(step, byIndex.get(i))), 0, 1);
  });
  if (total <= 0) return 0;
  return round2(clamp(weighted / total, 0, 1));
}

/**
 * Stars earned: the choice's offer, filled by the work.
 *
 * Returns a fraction — 2.4 is two stars and a third of the next one — so the interface can draw a
 * partial mark without this module knowing how a mark is drawn.
 */
export function starsEarned(choice: DifficultyChoice, work: number): number {
  return round2(STARS_ON_OFFER[choice] * clamp(num(work), 0, 1));
}

/**
 * What one finished session was worth, from the row the database already keeps.
 *
 * `prescribed` and `results` are both stored as jsonb on `workout_sessions`, so this needs no
 * migration and no new column — the star is a second reading of rows that already exist, which
 * also means it appears on sessions people did before it shipped.
 *
 * Null when the row cannot answer: an unfinished session, or one stored before the prescription
 * was kept. A missing star is honest; a guessed one is not.
 */
export function starsForSession(row: {
  difficulty?: DifficultyChoice | null;
  prescribed?: PrescribedWorkout | null;
  results?: ExerciseResult[] | null;
  completedAt?: string | null;
}): number | null {
  if (!row.completedAt || !row.prescribed) return null;
  return starsEarned(row.difficulty ?? 'normal', workDone(row.prescribed, row.results ?? []));
}

/** One attempt at a node, reduced to what a star is computed from. */
export interface StarAttempt {
  choice: DifficultyChoice;
  /** The share of the main work done, from {@link workDone}. */
  work: number;
}

/**
 * The best a node has ever been done, over every attempt at it.
 *
 * Best, not latest, and deliberately: the mechanic is "go back and take it harder", and an
 * athlete who repeats a day on a bad morning must not lose the three stars they already have.
 * Nothing here halves a repeat — `REPEAT_POINTS` does that to points, where the reason is that
 * the course should not be farmed for currency. Stars are the opposite: repeating is the thing
 * they exist to ask for.
 */
export function bestStars(attempts: readonly StarAttempt[]): number {
  let best = 0;
  for (const a of attempts) best = Math.max(best, starsEarned(a.choice, a.work));
  return round2(best);
}

/**
 * How to draw three marks for a score: how many are full, and how full the next one is.
 *
 * `partial` is 0 when the next mark has not been started and never reaches 1 — a mark that is
 * full is counted in `full`, because a mark drawn at 99% and a mark drawn whole are the same
 * picture and only one of them is true.
 */
export function starMarks(stars: number): { full: number; partial: number; empty: number } {
  const s = clamp(num(stars), 0, STARS_MAX);
  const full = Math.floor(s + 1e-9);
  const partial = round2(s - full);
  return { full, partial, empty: STARS_MAX - full - (partial > 0 ? 1 : 0) };
}
