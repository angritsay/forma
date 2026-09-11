/**
 * Custom workouts — the coach builds one in the admin panel from library exercises; it is stored
 * as a small JSON `structure` and played through the very same player as a course workout.
 *
 * The bridge is {@link buildPrescribedFromCustom}: it turns the authored structure into a
 * `PrescribedWorkout` (the shape `buildPlayerSteps` consumes), with no scaling and no substitution —
 * the athlete gets exactly what the coach wrote. Sections become blocks (warm-up / main / cool-down),
 * so the player's three-part stepper, warm-up gate, explanations and rest all work unchanged.
 */
import { findExercise } from '@/content/catalogue';
import type { BlockFormat, BlockType, ExerciseUnit, L10n, Load } from '@/content/schema';
import { estimateBlockDuration } from './estimate';
import { estimateItemSec } from './prescribe';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from './types';

/** Which part of the workout a section belongs to. Drives the player's section stepper. */
export type CustomSectionKind = 'warmup' | 'main' | 'cooldown';

/** One movement in a section: an exercise for a measured amount of work, then a rest. */
export interface CustomWorkoutItem {
  exerciseId: string;
  /**
   * How the work is measured.
   *
   * The builder writes reps or seconds; meters and calories exist because the content model has
   * them and a course written as a file must survive being imported into the builder unchanged.
   */
  unit: ExerciseUnit;
  /** Reps, seconds, metres or calories. */
  target: number;
  /** Count / hold per side (the total shown is doubled). */
  perSide?: boolean;
  /** Rest after this movement, in seconds. */
  restAfterSec: number;
  /** Coach's note, Russian. */
  note?: string;
  /** The English half of the note, kept so an imported course round-trips. */
  noteEn?: string;
  /** Relative load, when the exercise takes a weight. */
  load?: Load;
}

/**
 * A part of the workout: a titled group of movements, run in the shape `format` describes.
 *
 * Everything below `items` beyond `sets` belongs to a particular format, and mirrors `BlockSchema`
 * field for field. They are optional here and required there: the builder's own screens write
 * circuits and straight sets, but an imported course brings EMOMs, AMRAPs, for-time pieces and
 * Tabatas, and dropping their timing would quietly turn a 12-minute EMOM into twelve rounds of
 * something else.
 */
export interface CustomWorkoutSection {
  kind: CustomSectionKind;
  format: BlockFormat;
  /** Sets (sets), rounds (circuit/tabata/interval), minutes (emom); 1 for amrap/fortime. */
  sets: number;
  /**
   * `BlockSchema.rounds` as the imported block carried it, when it is not the same number as
   * {@link sets}.
   *
   * The content model has both `sets` and `rounds`, and which one a block uses is not decided by
   * its format: a for-time piece is written with `sets`, an AMRAP with neither, and some blocks
   * carry both. {@link setsField} says where {@link sets} came from; this keeps the other one when
   * there was one, so a block with both survives.
   */
  rounds?: number;
  /**
   * Which `BlockSchema` field {@link sets} came out of, for a section imported from content.
   * `none` means the block carried no repeat count at all — an AMRAP bounded only by its duration.
   */
  setsField?: 'sets' | 'rounds' | 'none';
  /** AMRAP length, or the for-time cap. */
  durationSec?: number;
  /** Work and rest of one interval (tabata, interval). */
  workSec?: number;
  restSec?: number;
  restBetweenSetsSec?: number;
  restBetweenRoundsSec?: number;
  /** Optional Russian title override; falls back to the section's default name. */
  title?: string;
  /** Optional Russian note shown under the title. */
  description?: string;
  /*
   * The English halves. The builder writes Russian — the product is Russian — but the content model
   * carries both, and an imported course must come back out with its English intact.
   */
  titleEn?: string;
  descriptionEn?: string;
  /** False on a block the course marks as not scalable (a test, a fixed benchmark). */
  scalable?: boolean;
  /**
   * The block's own id and type, when this section was imported from a content workout.
   *
   * The builder has three section kinds and `BlockType` has seven, so the kind alone cannot say
   * what an imported block was. Keeping both means a course can go into the builder and come back
   * out byte-identical; a section written here has neither and is typed from its kind.
   */
  blockId?: string;
  blockType?: BlockType;
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
      const exercise = findExercise(it.exerciseId);
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
      if (it.load) item.loadLabel = it.load;
      return item;
    });

    const block: PrescribedBlock = {
      blockId: `sec_${index}`,
      type: KIND_TO_TYPE[section.kind],
      format: section.format,
      sets: Math.max(1, Math.round(section.sets)),
      restBetweenSetsSec: Math.max(0, Math.round(section.restBetweenSetsSec ?? 0)),
      restBetweenRoundsSec: Math.max(0, Math.round(section.restBetweenRoundsSec ?? 0)),
      items,
      estimatedSec: 0,
      scaled: false,
    };
    // Timing belongs to the format: without it the estimator falls back to counting the work, and
    // an 8-minute AMRAP would be reported as however long one pass through its items takes.
    if (section.durationSec !== undefined) block.durationSec = section.durationSec;
    if (section.workSec !== undefined) block.workSec = section.workSec;
    if (section.restSec !== undefined) block.restSec = section.restSec;
    if (section.title && section.title.trim()) block.title = ru(section.title.trim());
    if (section.description && section.description.trim()) {
      block.description = ru(section.description.trim());
    }
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
