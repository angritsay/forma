/**
 * Pure helpers shared by the player and summary screens: content lookups for steps, localized
 * labels for targets / sets / block formats, and result shapes.
 */
import type { BlockFormat, BlockType, Exercise, ExerciseUnit, Load } from '@/content/schema';
import { EXERCISE_BY_ID } from '@/content/registry';
import { plural, type Locale, type TKey, type TParams } from '@/i18n/index';
import { ISOMETRIC_ID_PATTERN } from '@/lib/training/constants';
import { conflictsWithLimitations } from '@/lib/training/prescribe';
import type {
  Limitation,
  PlayerStep,
  PrescribedBlock,
  PrescribedItem,
  PrescribedWorkout,
} from '@/lib/training/types';
import type { PlayerResult } from '@/app/store/activeWorkout';

export type Translate = (key: TKey, params?: TParams) => string;

export type BlockIntroStep = Extract<PlayerStep, { kind: 'block_intro' }>;
export type ExplainStep = Extract<PlayerStep, { kind: 'explain' }>;
export type WorkStep = Extract<PlayerStep, { kind: 'work' }>;
export type RestStep = Extract<PlayerStep, { kind: 'rest' }>;
export type AmrapStep = Extract<PlayerStep, { kind: 'amrap' }>;
export type FortimeStep = Extract<PlayerStep, { kind: 'fortime' }>;

/** Steps that produce a result and count towards completion. */
export function isWorkType(step: PlayerStep): boolean {
  return step.kind === 'work' || step.kind === 'amrap' || step.kind === 'fortime';
}

export function findExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID.get(id);
}

export function findBlock(p: PrescribedWorkout, blockId: string): PrescribedBlock | undefined {
  return p.blocks.find((b) => b.blockId === blockId);
}

export function isTestBlock(block: PrescribedBlock | undefined): boolean {
  return block?.type === 'test';
}

/** Exercise name in the current locale, falling back to the id for unknown content. */
export function exerciseName(id: string, locale: Locale): string {
  const e = findExercise(id);
  return e ? e.name[locale] : id;
}

/**
 * The coach's video for an exercise in the viewer's language, falling back to Russian: the clips
 * are filmed once, and a language without its own recording still gets the demonstration.
 */
export function exerciseVideoRef(id: string | undefined, locale: Locale): string | undefined {
  const v = id ? findExercise(id)?.video : undefined;
  return v?.[locale] ?? v?.ru ?? undefined;
}

const ALL_LIMITATIONS: readonly Limitation[] = [
  'knees',
  'lower_back',
  'shoulders',
  'wrists',
  'hypertension',
  'pregnancy',
];

/**
 * Conditions under which the coach would swap or cap this movement — read straight off the
 * engine's substitution rules, so the "contraindications" tab never says something the app would
 * not itself act on. Hypertension is the one rule expressed as a cap (long isometric holds), not a
 * swap, so it is listed for holds.
 */
export function contraindicationsFor(exercise: Exercise, load?: Load): Limitation[] {
  return ALL_LIMITATIONS.filter((lim) =>
    lim === 'hypertension'
      ? ISOMETRIC_ID_PATTERN.test(exercise.id)
      : conflictsWithLimitations(exercise, load, new Set([lim])),
  );
}

const LIMITATION_KEY: Record<Limitation, TKey> = {
  knees: 'app.onbLimKnees',
  lower_back: 'app.onbLimLowerBack',
  shoulders: 'app.onbLimShoulders',
  wrists: 'app.onbLimWrists',
  hypertension: 'app.onbLimHypertension',
  pregnancy: 'app.onbLimPregnancy',
};

export function limitationLabel(t: Translate, lim: Limitation): string {
  return t(LIMITATION_KEY[lim]);
}

export function unitLabel(t: Translate, unit: ExerciseUnit): string {
  return t(`training.${unit}`);
}

/** "12 reps", "30 sec · per side". */
export function targetLabel(
  t: Translate,
  item: Pick<PrescribedItem, 'unit' | 'target' | 'perSide'>,
): string {
  const base = `${item.target} ${unitLabel(t, item.unit)}`;
  return item.perSide ? `${base} · ${t('training.perSide')}` : base;
}

/** "8 kg" when a weight is chosen, else the load label ("medium"), else undefined. */
export function loadLabel(
  t: Translate,
  item: { loadKg?: number; loadLabel?: Load },
): string | undefined {
  if (item.loadKg !== undefined) return t('app.playerKg', { kg: item.loadKg });
  if (item.loadLabel) return t(`training.load_${item.loadLabel}`);
  return undefined;
}

export function formatLabel(t: Translate, format: BlockFormat): string {
  return t(`training.format_${format}`);
}

export function blockTypeLabel(t: Translate, type: BlockType): string {
  return t(`training.block_${type}`);
}

/** Localized block title (authored title, else the block type). */
export function blockTitle(
  t: Translate,
  locale: Locale,
  block: Pick<PrescribedBlock, 'title' | 'type'>,
): string {
  return block.title ? block.title[locale] : blockTypeLabel(t, block.type);
}

/**
 * The three parts a session reads as, the way the coach describes it: the warm-up, the workout
 * itself, and the cool-down. Every granular block type folds into one of them — warm-up and
 * cool-down are their own, everything else (strength, metcon, core, skill, the test) is the workout.
 */
export type BlockSection = 'warmup' | 'main' | 'cooldown';

export function blockSection(type: BlockType): BlockSection {
  if (type === 'warmup') return 'warmup';
  if (type === 'cooldown') return 'cooldown';
  return 'main';
}

const SECTION_KEY: Record<BlockSection, TKey> = {
  warmup: 'app.playerSectionWarmup',
  main: 'app.playerSectionMain',
  cooldown: 'app.playerSectionCooldown',
};

export function sectionLabel(t: Translate, section: BlockSection): string {
  return t(SECTION_KEY[section]);
}

/** The section the current step belongs to; a block intro carries its own type. */
export function sectionOfStep(step: PlayerStep, p: PrescribedWorkout): BlockSection {
  if (step.kind === 'warmup_gate') return 'warmup';
  if (step.kind === 'block_intro') return blockSection(step.type);
  if (step.kind === 'done') {
    const last = p.blocks[p.blocks.length - 1];
    return last ? blockSection(last.type) : 'main';
  }
  const block = findBlock(p, step.blockId);
  return block ? blockSection(block.type) : 'main';
}

/** Sections present in this workout, in order (warm-up → workout → cool-down), de-duplicated. */
export function workoutSections(p: PrescribedWorkout): BlockSection[] {
  const out: BlockSection[] = [];
  for (const b of p.blocks) {
    const s = blockSection(b.type);
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** When the workout section spans several blocks, which part this one is: {n, total}, else null. */
export function mainPart(
  p: PrescribedWorkout,
  blockId: string,
): { n: number; total: number } | null {
  const mains = p.blocks.filter((b) => blockSection(b.type) === 'main');
  if (mains.length < 2) return null;
  const i = mains.findIndex((b) => b.blockId === blockId);
  return i < 0 ? null : { n: i + 1, total: mains.length };
}

/** "Set 2 of 3" / "Round 2 of 3" / "Minute 2 of 12" depending on the block format. */
export function setLabel(t: Translate, format: BlockFormat, set: number, total: number): string {
  switch (format) {
    case 'sets':
      return t('app.playerSetOf', { n: set, total });
    case 'emom':
      return t('app.playerMinuteOf', { n: set, total });
    case 'circuit':
    case 'tabata':
    case 'interval':
    case 'amrap':
    case 'fortime':
      return t('app.playerRoundOf', { n: set, total });
  }
}

export function setsText(t: Translate, locale: Locale, n: number): string {
  return plural(locale, n, {
    one: t('app.playerSetsOne', { n }),
    few: t('app.playerSetsFew', { n }),
    many: t('app.playerSetsMany', { n }),
  });
}

export function roundsText(t: Translate, locale: Locale, n: number): string {
  return plural(locale, n, {
    one: t('app.playerRoundsOne', { n }),
    few: t('app.playerRoundsFew', { n }),
    many: t('app.playerRoundsMany', { n }),
  });
}

/** One-line structure of a block for intros and summaries. */
export function blockMeta(t: Translate, locale: Locale, block: PrescribedBlock): string {
  const min = Math.round((block.durationSec ?? 0) / 60);
  switch (block.format) {
    case 'sets':
      return setsText(t, locale, block.sets);
    case 'circuit':
      return roundsText(t, locale, block.sets);
    case 'emom':
      return `${formatLabel(t, 'emom')} · ${t('common.minutesShort', { n: block.sets })}`;
    case 'tabata':
      return `${formatLabel(t, 'tabata')} · ${block.sets} × ${block.workSec ?? 20}/${block.restSec ?? 10} ${t('training.seconds')}`;
    case 'interval':
      return `${roundsText(t, locale, block.sets)} · ${block.workSec ?? 30}/${block.restSec ?? 30} ${t('training.seconds')}`;
    case 'amrap':
      return t('training.amrapHint', { min });
    case 'fortime':
      return t('training.fortimeHint', { rounds: block.sets, min });
  }
}

/** Title for the player top bar. */
export function stepTitle(
  t: Translate,
  locale: Locale,
  step: PlayerStep,
  prescribed: PrescribedWorkout,
): string {
  switch (step.kind) {
    case 'warmup_gate':
      return t('app.playerSectionWarmup');
    case 'block_intro':
      return step.title ? step.title[locale] : blockTypeLabel(t, step.type);
    case 'explain':
    case 'work':
      return exerciseName(step.exerciseId, locale);
    case 'rest':
      return t('training.rest');
    case 'amrap':
    case 'fortime': {
      const block = findBlock(prescribed, step.blockId);
      return block ? blockTitle(t, locale, block) : formatLabel(t, step.kind);
    }
    case 'done':
      return '';
  }
}

/** Animation id shown behind a step (the exercise, or the first exercise of a block). */
export function stepAnimation(step: PlayerStep, prescribed: PrescribedWorkout): string | undefined {
  const first = (blockId: string) => findBlock(prescribed, blockId)?.items[0]?.exerciseId;
  let exerciseId: string | undefined;
  switch (step.kind) {
    case 'explain':
    case 'work':
      exerciseId = step.exerciseId;
      break;
    case 'rest':
      exerciseId = step.nextExerciseId ?? first(step.blockId);
      break;
    case 'warmup_gate':
    case 'block_intro':
    case 'amrap':
    case 'fortime':
      exerciseId = first(step.blockId);
      break;
    case 'done':
      exerciseId = prescribed.blocks[0]?.items[0]?.exerciseId;
      break;
  }
  return exerciseId ? findExercise(exerciseId)?.animation : undefined;
}

/** Result for a step the athlete chose to skip (null for steps without a result). */
export function skippedResult(step: PlayerStep, stepIndex: number): PlayerResult | null {
  switch (step.kind) {
    case 'work':
      return {
        stepIndex,
        blockId: step.blockId,
        exerciseId: step.exerciseId,
        completed: false,
        skipped: true,
      };
    case 'amrap':
    case 'fortime':
      return { stepIndex, blockId: step.blockId, completed: false, skipped: true };
    case 'warmup_gate':
    case 'block_intro':
    case 'explain':
    case 'rest':
    case 'done':
      return null;
  }
}

/** Clamp a hand-entered count. */
export const COUNT_MAX = 999;
export function clampCount(n: number, max = COUNT_MAX): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}
