/**
 * What makes a particular piece of training easier or harder.
 *
 * The engine used to answer that question once, globally: trim a set, nudge the reps, move the
 * window. It is a reasonable answer and for two workouts in three it is the wrong one. Reading the
 * twenty sessions of «Старт» in order makes it obvious —
 *
 *   workout 1   EMOM, a movement every minute   the reps ARE the rest; move them
 *   workout 3   three pairs, start every 2 min  move the rest between pairs
 *   workout 5   three rounds, 10-minute cap     move the number of rounds
 *   workout 6   AMRAP 8                         move the window
 *   workout 17  buy-in every 3 minutes          move the interval
 *   workout 19  the inchworm ladder             move NOTHING — it is the benchmark
 *
 * — and a single rule cannot be right for all six. So the lever is authored per block, in the
 * admin, by the person who wrote the piece and knows what it is for. `DEFAULT_ADAPT` below keeps
 * every already-written block working untouched; authoring is for where the coach wants it.
 *
 * Pure, like everything in this directory: a block in, a block out, no I/O and no clock.
 */
import type { AdaptStep, Block, BlockFormat } from '@/content/schema';
import {
  LEVER_INTERVAL_FLOOR_SEC,
  LEVER_RCENTRE,
  LEVER_REST_FLOOR_SEC,
  LEVER_ROUNDS_MIN,
} from './constants';
import type { DifficultyChoice } from './types';
import { clamp } from './util';

/**
 * What each format gets when nobody has said otherwise.
 *
 * These are the levers the format itself makes available — an AMRAP has no sets to trim, an EMOM's
 * rest is whatever is left of the minute — so they are defaults in the strong sense: the honest
 * answer for that shape of work, not a placeholder.
 */
export const DEFAULT_ADAPT: Readonly<Record<BlockFormat, readonly AdaptStep[]>> = {
  sets: [{ lever: 'reps', easier: 0.83, harder: 1.17 }],
  circuit: [
    { lever: 'rounds', easier: 0.8, harder: 1.2 },
    { lever: 'reps', easier: 0.9, harder: 1.1 },
  ],
  amrap: [{ lever: 'window', easier: 0.8, harder: 1.2 }],
  emom: [{ lever: 'reps', easier: 0.83, harder: 1.17 }],
  fortime: [{ lever: 'reps', easier: 0.8, harder: 1.2 }],
  tabata: [{ lever: 'rounds', easier: 0.75, harder: 1.25 }],
  interval: [{ lever: 'rounds', easier: 0.8, harder: 1.2 }],
};

/** A block that must not move at all, whatever the athlete chose. */
export function isFrozen(block: Pick<Block, 'type' | 'scalable'>): boolean {
  // A warm-up is the coach's joint routine and a test is the thing the course is measured by. Both
  // are the same at every difficulty or they are worth nothing.
  return block.scalable === false || block.type === 'test';
}

/** The levers in play for a block: what it declares, else what its format implies. */
export function adaptStepsFor(
  block: Pick<Block, 'type' | 'format' | 'scalable' | 'adapt'>,
): readonly AdaptStep[] {
  if (isFrozen(block)) return [{ lever: 'none' }];
  const declared = block.adapt;
  if (declared && declared.length > 0) return declared;
  return DEFAULT_ADAPT[block.format] ?? [{ lever: 'reps', easier: 0.83, harder: 1.17 }];
}

/** The multiplier a step applies for a choice. `normal` never moves anything. */
export function leverFactor(step: AdaptStep, choice: DifficultyChoice): number {
  if (choice === 'normal') return 1;
  const raw = choice === 'easier' ? step.easier : step.harder;
  return typeof raw === 'number' && raw > 0 ? raw : 1;
}

/** What the levers do to a block's own numbers — everything except the per-item targets. */
export interface BlockShape {
  sets?: number | undefined;
  rounds?: number | undefined;
  durationSec?: number | undefined;
  restBetweenSetsSec?: number | undefined;
  restBetweenRoundsSec?: number | undefined;
  /**
   * Multiplier the `reps` lever contributes, for the caller to fold into each item's target.
   *
   * Whoever wires this in: fold it into the target **before** prescribe.ts rounds a two-sided
   * movement to an even number (`evenTarget`). A lunge count that comes out odd after the rounding
   * gives one leg a rep the other never gets, which is the bug that rule exists to prevent.
   */
  repsFactor: number;
  /** True when `swap` is in play, so the caller should look for a harder or easier movement. */
  swap: boolean;
}

/**
 * Apply a block's levers for one difficulty choice.
 *
 * Note what `rest` does: at «полегче» rest goes UP, not down. Every other lever shrinks to make a
 * session easier; rest is the one that grows, because more rest is what makes the same work
 * possible. Authoring it the other way round is the easiest mistake to make here, so the sign is
 * applied in one place — the multiplier authored for `rest` is read as-is, and a coach writing
 * `{ easier: 1.5, harder: 0.7 }` is saying exactly what they mean.
 */
export function applyLevers(
  block: Pick<
    Block,
    | 'type'
    | 'format'
    | 'scalable'
    | 'adapt'
    | 'sets'
    | 'rounds'
    | 'durationSec'
    | 'restBetweenSetsSec'
    | 'restBetweenRoundsSec'
  >,
  choice: DifficultyChoice,
): BlockShape {
  const shape: BlockShape = {
    sets: block.sets,
    rounds: block.rounds,
    durationSec: block.durationSec,
    restBetweenSetsSec: block.restBetweenSetsSec,
    restBetweenRoundsSec: block.restBetweenRoundsSec,
    repsFactor: 1,
    swap: false,
  };
  if (isFrozen(block)) return shape;

  for (const step of adaptStepsFor(block)) {
    const f = leverFactor(step, choice);
    switch (step.lever) {
      case 'reps':
        shape.repsFactor *= f;
        break;
      case 'rounds':
        // Sets and rounds are the same idea wearing two field names, so move whichever this
        // format actually uses.
        if (shape.sets !== undefined) shape.sets = roundsAfter(shape.sets, f);
        if (shape.rounds !== undefined) shape.rounds = roundsAfter(shape.rounds, f);
        break;
      case 'rest':
        shape.restBetweenSetsSec = restAfter(shape.restBetweenSetsSec, f);
        shape.restBetweenRoundsSec = restAfter(shape.restBetweenRoundsSec, f);
        break;
      case 'window':
        if (shape.durationSec !== undefined) {
          shape.durationSec = Math.max(30, Math.round((shape.durationSec * f) / 5) * 5);
        }
        break;
      case 'interval':
        // The interval a piece starts on lives in `durationSec` for a for-time window and in the
        // fixed 60 s of an EMOM minute, which the player owns. Only the former can move here.
        if (shape.durationSec !== undefined) {
          shape.durationSec = Math.max(
            LEVER_INTERVAL_FLOOR_SEC,
            Math.round((shape.durationSec * f) / 5) * 5,
          );
        }
        break;
      case 'swap':
        if (choice !== 'normal') shape.swap = true;
        break;
      case 'none':
        return {
          ...shape,
          sets: block.sets,
          rounds: block.rounds,
          durationSec: block.durationSec,
          repsFactor: 1,
          swap: false,
        };
    }
  }
  return shape;
}

/** Rounds never fall below one honest round: one done properly beats skipping the session. */
function roundsAfter(current: number, factor: number): number {
  return Math.max(LEVER_ROUNDS_MIN, Math.round(current * factor));
}

/**
 * Rest rounds to five seconds, and a rest that exists never rounds away to nothing — a block
 * authored with 20 s between rounds means to have a pause there, however ambitious the athlete.
 */
function restAfter(current: number | undefined, factor: number): number | undefined {
  if (current === undefined) return undefined;
  if (current === 0) return 0;
  return Math.max(LEVER_REST_FLOOR_SEC, Math.round((current * factor) / 5) * 5);
}

/**
 * How far along the levers a given athlete should be pushed.
 *
 * The mode says which direction; the athlete's own ratio says how far. Someone already far from
 * average has had most of the adjustment made for them by the ratio itself, so the mode moves them
 * less — otherwise the two compound and the strong get an unreachable session while the weak get
 * one with nothing in it.
 */
export function temper(ratio: number, factor: number): number {
  if (factor === 1) return 1;
  const distance = Math.abs(clamp(ratio, 0.4, 2.5) - 1);
  const damped = 1 / (1 + distance * LEVER_RCENTRE);
  return 1 + (factor - 1) * damped;
}
