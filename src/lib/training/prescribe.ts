/**
 * Turn an authored workout into concrete numbers for one athlete: scaled targets, sets, rest,
 * substitutions for level / equipment / limitations, loads and time estimates.
 * Rules: docs/TRAINING_SCIENCE.md §3.
 */
import type {
  Block,
  Exercise,
  ExerciseUnit,
  L10n,
  Load,
  Workout,
  WorkoutItem,
} from '@/content/schema';
import {
  CHOICE_REST,
  CHOICE_VOLUME,
  DEFAULT_SECONDS_PER_REP,
  DELOAD_REST,
  DELOAD_VOLUME,
  EFFECTIVE_SCALE_MAX,
  EFFECTIVE_SCALE_MIN,
  HYPERTENSION_MAX_HOLD_SEC,
  ISOMETRIC_ID_PATTERN,
  KNEE_RISKY_IDS,
  LOWER_BACK_RISKY_IDS,
  METERS_PER_SEC,
  MIN_SECONDS_TARGET,
  MIN_SETS_AFTER_REMOVE,
  ON_HANDS_ID_PATTERN,
  OVERHEAD_ID_PATTERN,
  SEC_PER_CALORIE,
  SETS_ADD_AT,
  SETS_REMOVE_AT,
  TABATA_DEFAULT_ROUNDS,
} from './constants';
import { estimateBlockDuration, estimatePoints, registryLookup } from './estimate';
import { PRESCRIBE_NOTE } from './messages';
import type {
  DifficultyChoice,
  ExerciseLookup,
  Limitation,
  PrescribeOptions,
  PrescribedBlock,
  PrescribedItem,
  PrescribedWorkout,
  UserTrainingProfile,
} from './types';
import { clamp, round5, sum } from './util';

/* ---------------------------------------------------------------------------------------------
 * Exercise classification helpers
 * ------------------------------------------------------------------------------------------- */

/** True when the athlete can do the exercise with what they own (`none`/`mat` always available). */
export function hasEquipmentFor(exercise: Exercise, owned: readonly string[]): boolean {
  return exercise.equipment.some((eq) => eq === 'none' || eq === 'mat' || owned.includes(eq));
}

export function isBodyweight(exercise: Exercise): boolean {
  return !exercise.loadable;
}

/** Wrists in extension on the floor (push-up family, planks, crawls, burpees). */
export function isOnHands(exercise: Exercise): boolean {
  return (
    (exercise.pattern === 'push_horizontal' && !exercise.loadable) ||
    ON_HANDS_ID_PATTERN.test(exercise.id) ||
    exercise.tags.includes('on_hands')
  );
}

/** Isometric hold (timed, static). */
export function isIsometricHold(exercise: Exercise): boolean {
  if (exercise.unit !== 'seconds') return false;
  return (
    exercise.pattern.startsWith('core_') ||
    ISOMETRIC_ID_PATTERN.test(exercise.id) ||
    exercise.tags.includes('isometric') ||
    exercise.tags.includes('hold')
  );
}

function isOverheadLoaded(exercise: Exercise): boolean {
  return (
    exercise.loadable &&
    (exercise.pattern === 'push_vertical' ||
      OVERHEAD_ID_PATTERN.test(exercise.id) ||
      exercise.tags.includes('overhead'))
  );
}

/**
 * Does the exercise conflict with one of the athlete's limitations?
 * `load` is the effective load label of the item (undefined for bodyweight).
 */
export function conflictsWithLimitations(
  exercise: Exercise,
  load: Load | undefined,
  limitations: ReadonlySet<Limitation>,
): boolean {
  if (limitations.has('knees')) {
    if (exercise.pattern === 'jump' || KNEE_RISKY_IDS.includes(exercise.id)) return true;
  }
  if (limitations.has('lower_back')) {
    const loaded = load === 'medium' || load === 'heavy';
    if ((exercise.pattern === 'hinge' && loaded) || LOWER_BACK_RISKY_IDS.includes(exercise.id))
      return true;
  }
  if (limitations.has('shoulders')) {
    if (
      exercise.pattern === 'push_vertical' ||
      exercise.pattern === 'pull_vertical' ||
      isOverheadLoaded(exercise)
    )
      return true;
  }
  if (limitations.has('wrists')) {
    if (isOnHands(exercise)) return true;
  }
  if (limitations.has('pregnancy')) {
    if (exercise.pattern === 'core_flexion' || exercise.pattern === 'jump') return true;
  }
  return false;
}

/* ---------------------------------------------------------------------------------------------
 * Loads
 * ------------------------------------------------------------------------------------------- */

/** Pick a concrete weight for a load label from the athlete's dumbbells / kettlebells. */
export function pickLoadKg(
  exercise: Exercise,
  label: Load,
  profile: Pick<UserTrainingProfile, 'dumbbellKg' | 'kettlebellKg'>,
): number | undefined {
  const pools: number[][] = [];
  for (const eq of exercise.equipment) {
    if (eq === 'dumbbells' && profile.dumbbellKg?.length) pools.push(profile.dumbbellKg);
    if (eq === 'kettlebell' && profile.kettlebellKg?.length) pools.push(profile.kettlebellKg);
  }
  const pool = pools[0];
  if (!pool) return undefined;
  const weights = [...new Set(pool.filter((w) => Number.isFinite(w) && w > 0))].sort(
    (a, b) => a - b,
  );
  if (weights.length === 0) return undefined;
  switch (label) {
    case 'light':
      return weights[0];
    case 'heavy':
      return weights[weights.length - 1];
    case 'medium':
      return weights[Math.floor((weights.length - 1) / 2)];
  }
}

/* ---------------------------------------------------------------------------------------------
 * Substitutions
 * ------------------------------------------------------------------------------------------- */

interface SubstitutionContext {
  profile: UserTrainingProfile;
  limitations: ReadonlySet<Limitation>;
  level: 1 | 2 | 3;
  choice: DifficultyChoice;
  lookup: ExerciseLookup;
}

type Issue = 'equipment' | 'limitation' | 'level';

/** Original followed by up to `maxSteps` easier variants (cycles and unknown ids stop the walk). */
export function easierChain(exercise: Exercise, lookup: ExerciseLookup, maxSteps = 2): Exercise[] {
  const out = [exercise];
  const seen = new Set([exercise.id]);
  let cur = exercise;
  for (let i = 0; i < maxSteps; i++) {
    const id = cur.scaling.easier;
    if (!id || seen.has(id)) break;
    const next = lookup(id);
    if (!next) break;
    out.push(next);
    seen.add(id);
    cur = next;
  }
  return out;
}

function effectiveLoadLabel(
  exercise: Exercise,
  authored: Load | undefined,
  limitations: ReadonlySet<Limitation>,
): Load | undefined {
  if (!exercise.loadable) return undefined;
  let label: Load = authored ?? 'medium';
  if (label === 'heavy' && (limitations.has('hypertension') || limitations.has('pregnancy')))
    label = 'medium';
  return label;
}

function issuesOf(exercise: Exercise, authoredLoad: Load | undefined, ctx: SubstitutionContext) {
  const issues = new Set<Issue>();
  if (!hasEquipmentFor(exercise, ctx.profile.equipment)) issues.add('equipment');
  const load = effectiveLoadLabel(exercise, authoredLoad, ctx.limitations);
  if (conflictsWithLimitations(exercise, load, ctx.limitations)) issues.add('limitation');
  if (ctx.level === 1) {
    if (exercise.level === 3) issues.add('level');
    if (exercise.level === 2 && ctx.choice === 'easier') issues.add('level');
  }
  return issues;
}

/**
 * Resolve the exercise actually prescribed for an item.
 * Walks `scaling.easier` (2 steps) when the original is unsuitable; uses `scaling.harder`
 * (1 step) for confident level-3 athletes on bodyweight moves.
 */
export function substituteExercise(
  original: Exercise,
  item: Pick<WorkoutItem, 'load'>,
  ctx: SubstitutionContext,
): { exercise: Exercise; note?: L10n } {
  const originalIssues = issuesOf(original, item.load, ctx);
  if (originalIssues.size === 0) {
    if (
      ctx.choice === 'harder' &&
      ctx.level === 3 &&
      isBodyweight(original) &&
      original.scaling.harder
    ) {
      const harder = ctx.lookup(original.scaling.harder);
      if (harder && issuesOf(harder, item.load, ctx).size === 0) return { exercise: harder };
    }
    return { exercise: original };
  }

  const chain = easierChain(original, ctx.lookup, 2);
  const issues = chain.map((e) => issuesOf(e, item.load, ctx));

  // 1. A candidate with no issues at all.
  for (let i = 0; i < chain.length; i++) if (issues[i]!.size === 0) return { exercise: chain[i]! };
  // 2. Doable and safe, merely above the athlete's level.
  for (let i = 0; i < chain.length; i++) {
    const is = issues[i]!;
    if (!is.has('equipment') && !is.has('limitation')) return { exercise: chain[i]! };
  }
  // 3. Doable but still touching a limitation: step down to the first easier variant the athlete
  //    can do (less load on the sensitive area) and warn; fall back to the original.
  const order = [...chain.keys()].slice(1).concat(0);
  for (const i of order) {
    if (!issues[i]!.has('equipment'))
      return { exercise: chain[i]!, note: PRESCRIBE_NOTE.limitationCaution };
  }
  // 4. Nothing doable without equipment the athlete lacks: keep the original and say so.
  return { exercise: original, note: PRESCRIBE_NOTE.equipmentNeeded };
}

/* ---------------------------------------------------------------------------------------------
 * Targets, sets, rest
 * ------------------------------------------------------------------------------------------- */

function givenUnit(item: WorkoutItem): { unit: ExerciseUnit; value: number } {
  if (item.reps !== undefined) return { unit: 'reps', value: item.reps };
  if (item.seconds !== undefined) return { unit: 'seconds', value: item.seconds };
  if (item.meters !== undefined) return { unit: 'meters', value: item.meters };
  return { unit: 'calories', value: item.calories ?? 1 };
}

export function scaleTarget(unit: ExerciseUnit, value: number, scale: number): number {
  switch (unit) {
    case 'reps':
      return Math.max(1, Math.round(value * scale));
    case 'seconds':
      return Math.max(MIN_SECONDS_TARGET, round5(value * scale));
    case 'meters':
      return Math.max(5, round5(value * scale));
    case 'calories':
      return Math.max(1, Math.round(value * scale));
  }
}

/** Rest rounded to 5 s; a non-zero rest never rounds down to 0. */
export function scaleRest(sec: number | undefined, multiplier: number): number {
  const base = sec ?? 0;
  if (base <= 0) return 0;
  return Math.max(5, round5(base * multiplier));
}

function effectiveSets(block: Block, scale: number, scalable: boolean): number {
  switch (block.format) {
    case 'sets':
    case 'circuit': {
      const base = block.sets ?? 1;
      if (!scalable) return base;
      if (scale >= SETS_ADD_AT) return base + 1;
      if (scale <= SETS_REMOVE_AT) return Math.max(Math.min(base, MIN_SETS_AFTER_REMOVE), base - 1);
      return base;
    }
    case 'emom':
      return block.rounds ?? 1;
    case 'tabata':
      return block.rounds ?? TABATA_DEFAULT_ROUNDS;
    case 'interval':
      return block.rounds ?? 1;
    case 'amrap':
      return 1;
    case 'fortime':
      return block.sets ?? 1;
  }
}

export function estimateItemSec(
  unit: ExerciseUnit,
  target: number,
  perSide: boolean,
  exercise: Exercise | undefined,
): number {
  switch (unit) {
    case 'reps':
      return target * (exercise?.secondsPerRep ?? DEFAULT_SECONDS_PER_REP) * (perSide ? 2 : 1);
    case 'seconds':
      return target * (perSide ? 2 : 1);
    case 'meters':
      return target / METERS_PER_SEC;
    case 'calories':
      return target * SEC_PER_CALORIE;
  }
}

function joinNotes(engine: L10n | undefined, authored: L10n | undefined): L10n | undefined {
  if (engine && authored)
    return { ru: `${engine.ru} ${authored.ru}`, en: `${engine.en} ${authored.en}` };
  return engine ?? authored;
}

/* ---------------------------------------------------------------------------------------------
 * Main entry
 * ------------------------------------------------------------------------------------------- */

export function prescribeWorkout(
  workout: Workout,
  opts: PrescribeOptions,
  exerciseLookup: ExerciseLookup = registryLookup,
): PrescribedWorkout {
  const limitations = new Set<Limitation>(opts.profile.limitations ?? []);
  // Pregnancy caps intensity: the whole prescription is built as "easier".
  const choice: DifficultyChoice = limitations.has('pregnancy') ? 'easier' : opts.choice;
  const deload = opts.deload === true;
  const effectiveScale = clamp(
    opts.scale * CHOICE_VOLUME[choice] * (deload ? DELOAD_VOLUME : 1),
    EFFECTIVE_SCALE_MIN,
    EFFECTIVE_SCALE_MAX,
  );
  const restMultiplier = CHOICE_REST[choice] * (deload ? DELOAD_REST : 1);
  const ctx: SubstitutionContext = {
    profile: opts.profile,
    limitations,
    level: opts.level,
    choice,
    lookup: exerciseLookup,
  };

  const blocks = workout.blocks.map((block) => {
    const scalable = block.scalable !== false;
    const s = scalable ? effectiveScale : 1;
    const restMul = scalable ? restMultiplier : CHOICE_REST[choice];
    const sets = effectiveSets(block, effectiveScale, scalable);

    const items: PrescribedItem[] = block.items.map((item) => {
      const original = exerciseLookup(item.exerciseId);
      let exercise = original;
      let note: L10n | undefined;
      if (original) {
        const r = substituteExercise(original, item, ctx);
        exercise = r.exercise;
        note = r.note;
      }
      const { unit, value } = givenUnit(item);
      let target = scaleTarget(unit, value, s);
      if (
        limitations.has('hypertension') &&
        unit === 'seconds' &&
        exercise &&
        isIsometricHold(exercise)
      ) {
        target = Math.min(target, HYPERTENSION_MAX_HOLD_SEC);
      }
      const perSide = item.perSide === true;
      const loadLabel = exercise ? effectiveLoadLabel(exercise, item.load, limitations) : item.load;
      const loadKg =
        exercise && exercise.loadable && loadLabel
          ? pickLoadKg(exercise, loadLabel, opts.profile)
          : undefined;

      const out: PrescribedItem = {
        exerciseId: exercise?.id ?? item.exerciseId,
        originalExerciseId: item.exerciseId,
        substituted: exercise !== undefined && exercise.id !== item.exerciseId,
        unit,
        target,
        perSide,
        restAfterSec: scaleRest(item.restAfterSec, restMul),
        estimatedSec: estimateItemSec(unit, target, perSide, exercise),
      };
      if (loadLabel) out.loadLabel = loadLabel;
      if (loadKg !== undefined) out.loadKg = loadKg;
      const finalNote = joinNotes(note, item.note);
      if (finalNote) out.note = finalNote;
      return out;
    });

    const prescribed: PrescribedBlock = {
      blockId: block.id,
      type: block.type,
      format: block.format,
      sets,
      restBetweenSetsSec: scaleRest(block.restBetweenSetsSec, restMul),
      restBetweenRoundsSec: scaleRest(block.restBetweenRoundsSec, restMul),
      items,
      estimatedSec: 0,
      scaled: scalable,
    };
    if (block.title) prescribed.title = block.title;
    if (block.description) prescribed.description = block.description;
    if (block.durationSec !== undefined) prescribed.durationSec = block.durationSec;
    if (block.workSec !== undefined) prescribed.workSec = block.workSec;
    if (block.restSec !== undefined) {
      prescribed.restSec =
        block.format === 'interval' ? scaleRest(block.restSec, restMul) : block.restSec;
    }
    prescribed.estimatedSec = estimateBlockDuration(prescribed).totalSec;
    return prescribed;
  });

  return {
    workoutId: workout.id,
    choice,
    scale: opts.scale,
    effectiveScale,
    deload,
    blocks,
    estimatedSec: sum(blocks.map((b) => b.estimatedSec)),
    points: estimatePoints(workout, choice, {
      ...(opts.repeat !== undefined ? { repeat: opts.repeat } : {}),
      ...(opts.streakDays !== undefined ? { streakDays: opts.streakDays } : {}),
    }),
  };
}
