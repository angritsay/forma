/**
 * Duration, calorie and points estimates for a prescribed workout.
 * Rules: docs/TRAINING_SCIENCE.md §4–§5.
 */
import { EXERCISE_BY_ID } from '@/content/registry';
import type { Workout } from '@/content/schema';
import {
  AMRAP_WORK_SHARE,
  BLOCK_INTRO_SEC,
  CHOICE_POINTS,
  DEFAULT_MET,
  DEFAULT_WEIGHT_KG,
  FORMAT_DEFAULT_WORK_REST,
  FORTIME_PACE_FACTOR,
  REPEAT_POINTS,
  REST_MET,
  STREAK_BONUS,
  TABATA_DEFAULT_ROUNDS,
  TRANSITION_SEC,
} from './constants';
import type {
  DifficultyChoice,
  DurationEstimate,
  ExerciseLookup,
  PrescribedBlock,
  PrescribedItem,
  PrescribedWorkout,
} from './types';
import { num, sum } from './util';

export const registryLookup: ExerciseLookup = (id) => EXERCISE_BY_ID.get(id);

/** A block split into MET-weighted work segments, rest and overhead (transitions + intro). */
export interface BlockSegments {
  /** Work segments with the MET of the exercise performed. */
  work: { sec: number; met: number }[];
  workSec: number;
  restSec: number;
  /** Transitions between items and the block intro (counted at REST_MET for calories). */
  overheadSec: number;
  totalSec: number;
}

function metOf(item: PrescribedItem, lookup: ExerciseLookup): number {
  return num(lookup(item.exerciseId)?.met, DEFAULT_MET);
}

/** Estimated work seconds of one item, never negative and never NaN (stored JSON can be null). */
function itemSec(item: PrescribedItem): number {
  return Math.max(0, num(item.estimatedSec));
}

/** Time-weighted average MET of a block's items (AMRAP/EMOM where items interleave). */
function averageMet(items: readonly PrescribedItem[], lookup: ExerciseLookup): number {
  const total = sum(items.map(itemSec));
  if (total <= 0) return items.length ? metOf(items[0]!, lookup) : DEFAULT_MET;
  return sum(items.map((it) => (itemSec(it) / total) * metOf(it, lookup)));
}

/** Rounds of a For-time block: authored sets, else 1. */
function fortimeRounds(block: PrescribedBlock): number {
  return Math.max(1, num(block.sets, 1));
}

/**
 * Break a prescribed block into work / rest / overhead seconds.
 * The same split drives duration and calories so the two never disagree.
 */
export function blockSegments(
  block: PrescribedBlock,
  lookup: ExerciseLookup = registryLookup,
): BlockSegments {
  const items = block.items;
  const n = items.length;
  const work: { sec: number; met: number }[] = [];
  let restSec = 0;
  let overheadSec = BLOCK_INTRO_SEC;

  switch (block.format) {
    case 'sets':
    case 'circuit': {
      const sets = Math.max(1, num(block.sets, 1));
      const between = num(
        block.format === 'circuit'
          ? block.restBetweenRoundsSec || block.restBetweenSetsSec
          : block.restBetweenSetsSec || block.restBetweenRoundsSec,
      );
      for (const it of items) work.push({ sec: sets * itemSec(it), met: metOf(it, lookup) });
      if (n > 0) {
        // The player rests after every item but the last, and between sets only between sets:
        // the trailing rest of the final set is never played.
        const inSet = sum(items.slice(0, n - 1).map((it) => num(it.restAfterSec)));
        const tail = between > 0 ? between : num(items[n - 1]?.restAfterSec);
        restSec = sets * inSet + (sets - 1) * tail;
      }
      overheadSec += sets * n * TRANSITION_SEC;
      break;
    }
    case 'amrap': {
      const d = Math.max(0, num(block.durationSec));
      work.push({ sec: d * AMRAP_WORK_SHARE, met: averageMet(items, lookup) });
      restSec = d * (1 - AMRAP_WORK_SHARE);
      break;
    }
    case 'emom': {
      const d = Math.max(1, num(block.sets, 1)) * 60;
      work.push({ sec: d * AMRAP_WORK_SHARE, met: averageMet(items, lookup) });
      restSec = d * (1 - AMRAP_WORK_SHARE);
      break;
    }
    case 'tabata': {
      const rounds = Math.max(1, num(block.sets, TABATA_DEFAULT_ROUNDS));
      const w = Math.max(0, num(block.workSec, FORMAT_DEFAULT_WORK_REST.tabata.workSec));
      const r = Math.max(0, num(block.restSec, FORMAT_DEFAULT_WORK_REST.tabata.restSec));
      for (const it of items) work.push({ sec: rounds * w, met: metOf(it, lookup) });
      // One Tabata per item: no rest after the last round, plus the gap between items.
      const gap = Math.max(num(block.restBetweenRoundsSec), r);
      restSec = n * (rounds - 1) * r + Math.max(0, n - 1) * gap;
      break;
    }
    case 'interval': {
      const rounds = Math.max(1, num(block.sets, 1));
      const w = Math.max(0, num(block.workSec, FORMAT_DEFAULT_WORK_REST.interval.workSec));
      const r = Math.max(0, num(block.restSec, FORMAT_DEFAULT_WORK_REST.interval.restSec));
      for (const it of items) work.push({ sec: rounds * w, met: metOf(it, lookup) });
      // Items alternate every round; the rest after the very last interval is never played.
      restSec = Math.max(0, rounds * n - 1) * r;
      break;
    }
    case 'fortime': {
      const rounds = fortimeRounds(block);
      const estWork = rounds * sum(items.map(itemSec)) * FORTIME_PACE_FACTOR;
      const estRest = (rounds - 1) * num(block.restBetweenRoundsSec);
      const cap = num(block.durationSec, Number.POSITIVE_INFINITY);
      const raw = estWork + estRest;
      const ratio = raw > 0 ? Math.min(1, cap / raw) : 1;
      const avg = averageMet(items, lookup);
      work.push({ sec: estWork * ratio, met: avg });
      restSec = estRest * ratio;
      break;
    }
  }

  const workSec = sum(work.map((s) => s.sec));
  return { work, workSec, restSec, overheadSec, totalSec: workSec + restSec + overheadSec };
}

/** Rounded duration of one block (seconds). */
export function estimateBlockDuration(block: PrescribedBlock): {
  totalSec: number;
  workSec: number;
  restSec: number;
} {
  const s = blockSegments(block, () => undefined);
  return {
    totalSec: Math.round(s.totalSec),
    workSec: Math.round(s.workSec),
    restSec: Math.round(s.restSec),
  };
}

/** Whole-workout duration with the work/rest split and a per-block breakdown. */
export function estimateDuration(p: PrescribedWorkout): DurationEstimate {
  const perBlock: { blockId: string; sec: number }[] = [];
  let totalSec = 0;
  let workSec = 0;
  let restSec = 0;
  for (const b of p.blocks) {
    const d = estimateBlockDuration(b);
    perBlock.push({ blockId: b.blockId, sec: d.totalSec });
    totalSec += d.totalSec;
    workSec += d.workSec;
    restSec += d.restSec;
  }
  return { totalSec, workSec, restSec, perBlock };
}

/**
 * Energy expenditure: kcal = MET × kg × hours (Compendium of Physical Activities convention).
 * Rest, transitions and intros count at REST_MET.
 */
export function estimateCalories(
  p: PrescribedWorkout,
  weightKg: number = DEFAULT_WEIGHT_KG,
  exerciseLookup: ExerciseLookup = registryLookup,
): number {
  const given = num(weightKg, DEFAULT_WEIGHT_KG);
  const kg = given > 0 ? given : DEFAULT_WEIGHT_KG;
  let kcal = 0;
  for (const b of p.blocks) {
    const s = blockSegments(b, exerciseLookup);
    for (const seg of s.work) kcal += (seg.met * kg * seg.sec) / 3600;
    kcal += (REST_MET * kg * (s.restSec + s.overheadSec)) / 3600;
  }
  return Math.round(kcal);
}

/** Streak bonus share for a streak length (first matching tier wins). */
export function streakBonus(streakDays: number | undefined): number {
  const days = num(streakDays);
  for (const tier of STREAK_BONUS) if (days >= tier.days) return tier.bonus;
  return 0;
}

/** Points for a full completion of a workout at the given choice. */
export function estimatePoints(
  workout: Workout,
  choice: DifficultyChoice,
  opts: { repeat?: boolean; streakDays?: number } = {},
): number {
  const base = num(workout.basePoints);
  const value =
    base *
    CHOICE_POINTS[choice] *
    (opts.repeat ? REPEAT_POINTS : 1) *
    (1 + streakBonus(opts.streakDays));
  return Math.round(value);
}
