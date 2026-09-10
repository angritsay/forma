/**
 * Custom workouts — the coach builds one in the admin panel from library exercises; it is stored
 * as a small JSON `structure` and played through the very same player as a course workout.
 *
 * The bridge is {@link buildPrescribedFromCustom}: it turns the authored structure into a
 * `PrescribedWorkout` (the shape `buildPlayerSteps` consumes), with no scaling and no substitution —
 * the athlete gets exactly what the coach wrote. Sections become blocks (warm-up / main / cool-down),
 * so the player's three-part stepper, warm-up gate, explanations and rest all work unchanged.
 */
import { EXERCISE_BY_ID } from '@/content/registry';
import type { BlockFormat, BlockType, L10n } from '@/content/schema';
import { estimateBlockDuration } from './estimate';
import { estimateItemSec } from './prescribe';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from './types';

/** Which part of the workout a section belongs to. Drives the player's section stepper. */
export type CustomSectionKind = 'warmup' | 'main' | 'cooldown';

/** One movement in a section: an exercise for reps or seconds, then a rest. */
export interface CustomWorkoutItem {
  exerciseId: string;
  unit: 'reps' | 'seconds';
  /** Reps, or seconds of work. */
  target: number;
  /** Count / hold per side (the total shown is doubled). */
  perSide?: boolean;
  /** Rest after this movement, in seconds. */
  restAfterSec: number;
  /** Coach's note, Russian. */
  note?: string;
}

/** A part of the workout: a titled group of movements repeated `sets` times. */
export interface CustomWorkoutSection {
  kind: CustomSectionKind;
  format: BlockFormat;
  /** Rounds / sets, at least 1. */
  sets: number;
  restBetweenRoundsSec?: number;
  /** Optional Russian title override; falls back to the section's default name. */
  title?: string;
  items: CustomWorkoutItem[];
}

/** The stored shape of a coach-built workout. */
export interface CustomWorkoutStructure {
  sections: CustomWorkoutSection[];
}

const KIND_TO_TYPE: Record<CustomSectionKind, BlockType> = {
  warmup: 'warmup',
  main: 'strength',
  cooldown: 'cooldown',
};

const clampInt = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));

function ru(text: string): L10n {
  // Product copy is Russian; a custom workout carries no separate English, so both values match.
  return { ru: text, en: text };
}

/** Points for a finished custom workout: proportional to work, capped under the server ceiling. */
export function customWorkoutPoints(estSec: number): number {
  return clampInt((estSec / 60) * 6, 40, 72);
}

/**
 * Turn a stored custom workout into a `PrescribedWorkout` the player can run.
 * `workoutId` is the workout's short id, which is also the session's node id.
 */
export function buildPrescribedFromCustom(
  workoutId: string,
  structure: CustomWorkoutStructure,
): PrescribedWorkout {
  const blocks: PrescribedBlock[] = structure.sections.map((section, index) => {
    const items: PrescribedItem[] = section.items.map((it) => {
      const exercise = EXERCISE_BY_ID.get(it.exerciseId);
      const perSide = it.perSide === true;
      const item: PrescribedItem = {
        exerciseId: it.exerciseId,
        originalExerciseId: it.exerciseId,
        substituted: false,
        unit: it.unit,
        target: it.target,
        perSide,
        restAfterSec: Math.max(0, Math.round(it.restAfterSec)),
        estimatedSec: estimateItemSec(it.unit, it.target, perSide, exercise),
      };
      if (it.note && it.note.trim()) item.note = ru(it.note.trim());
      return item;
    });

    const block: PrescribedBlock = {
      blockId: `sec_${index}`,
      type: KIND_TO_TYPE[section.kind],
      format: section.format,
      sets: Math.max(1, Math.round(section.sets)),
      restBetweenSetsSec: 0,
      restBetweenRoundsSec: Math.max(0, Math.round(section.restBetweenRoundsSec ?? 0)),
      items,
      estimatedSec: 0,
      scaled: false,
    };
    if (section.title && section.title.trim()) block.title = ru(section.title.trim());
    block.estimatedSec = estimateBlockDuration(block).totalSec;
    return block;
  });

  const estimatedSec = blocks.reduce((sum, b) => sum + b.estimatedSec, 0);
  return {
    workoutId,
    choice: 'normal',
    scale: 1,
    effectiveScale: 1,
    deload: false,
    blocks,
    estimatedSec,
    points: customWorkoutPoints(estimatedSec),
  };
}

/** True when a structure has at least one section with at least one valid item. */
export function isPlayableStructure(structure: CustomWorkoutStructure | undefined): boolean {
  return Boolean(
    structure?.sections?.some(
      (s) => s.items?.length > 0 && s.items.every((it) => it.exerciseId && it.target > 0),
    ),
  );
}
