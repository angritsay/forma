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
  CHOICE_SETS_DELTA,
  CHOICE_VOLUME,
  CHOICE_VOLUME_FORTIME,
  CHOICE_WINDOW,
  DEFAULT_SECONDS_PER_REP,
  DELOAD_REST,
  DELOAD_VOLUME,
  EFFECTIVE_SCALE_MAX,
  EFFECTIVE_SCALE_MIN,
  HYPERTENSION_MAX_HOLD_SEC,
  ISOMETRIC_ID_PATTERN,
  KNEE_RISKY_IDS,
  LOWER_BACK_RISKY_IDS,
  MAX_CHOICE_SET_BLOCKS,
  MAX_SETS_ADDED,
  METERS_PER_SEC,
  MIN_FORMAT_ROUNDS,
  MIN_SECONDS_TARGET,
  MIN_SETS_AFTER_REMOVE,
  MIN_SETS_EASIER,
  MIN_WINDOW_SEC,
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
import { clamp, num, round5, sum } from './util';

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
  /**
   * False in blocks that must keep the authored movement (warm-ups, cool-downs and, above all,
   * tests: a benchmark is only comparable when it is the same exercise every time).
   * Defaults to true.
   */
  allowHarderVariant?: boolean;
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
      ctx.allowHarderVariant !== false &&
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

/**
 * Sets (or rounds) actually prescribed.
 *
 * `structuralScale` is the athlete's own scale WITHOUT the difficulty choice folded in — the
 * choice contributes through CHOICE_SETS_DELTA instead, so it is counted exactly once.
 * Formats that run on their own clock (EMOM, Tabata, intervals) move their round count with
 * CHOICE_WINDOW rather than by whole sets.
 */
function effectiveSets(
  block: Block,
  structuralScale: number,
  scalable: boolean,
  choice: DifficultyChoice,
  choiceMovesThisBlock: boolean,
): number {
  switch (block.format) {
    case 'sets':
    case 'circuit': {
      const base = block.sets ?? 1;
      if (!scalable) return base;
      const fromScale =
        structuralScale >= SETS_ADD_AT ? 1 : structuralScale <= SETS_REMOVE_AT ? -1 : 0;
      const fromChoice = choiceMovesThisBlock ? CHOICE_SETS_DELTA[choice] : 0;
      const floor = Math.min(base, choice === 'easier' ? MIN_SETS_EASIER : MIN_SETS_AFTER_REMOVE);
      return clamp(base + fromScale + fromChoice, floor, base + MAX_SETS_ADDED);
    }
    case 'emom':
      return scaleRounds(block.rounds ?? 1, scalable, choice);
    case 'tabata':
      return scaleRounds(block.rounds ?? TABATA_DEFAULT_ROUNDS, scalable, choice);
    case 'interval':
      return scaleRounds(block.rounds ?? 1, scalable, choice);
    case 'amrap':
      return 1;
    // For-time has no rest to trade away, so its rounds are the lever. A single-round chipper
    // has none to give and moves on volume and the cap alone.
    case 'fortime':
      return scaleRounds(block.sets ?? 1, scalable, choice, 1);
  }
}

/** Rounds of a self-clocked format, moved by the choice and never below `floor`. */
function scaleRounds(
  rounds: number,
  scalable: boolean,
  choice: DifficultyChoice,
  floor: number = MIN_FORMAT_ROUNDS,
): number {
  if (!scalable || CHOICE_WINDOW[choice] === 1) return rounds;
  const scaled = Math.round(rounds * CHOICE_WINDOW[choice]);
  return Math.max(Math.min(rounds, floor), scaled);
}

/**
 * The blocks whose set count the choice is allowed to move: the biggest working blocks, capped at
 * MAX_CHOICE_SET_BLOCKS. Ranked by authored sets so the change lands on the main strength and
 * conditioning work rather than on a two-round core finisher.
 */
export function choiceSetBlockIds(workout: Workout): ReadonlySet<string> {
  const eligible = workout.blocks
    .filter((b) => b.scalable !== false && (b.format === 'sets' || b.format === 'circuit'))
    .map((b, order) => ({ id: b.id, sets: b.sets ?? 1, order }))
    .sort((a, b) => b.sets - a.sets || a.order - b.order)
    .slice(0, MAX_CHOICE_SET_BLOCKS);
  return new Set(eligible.map((b) => b.id));
}

/**
 * AMRAP / for-time window, moved by the choice and rounded to a whole half-minute.
 * "As usual" returns the authored number untouched: rounding a 200 s cap to the nearest 30 s
 * would quietly turn it into 210 even when the athlete asked for no change at all.
 */
function scaleWindow(sec: number, scalable: boolean, choice: DifficultyChoice): number {
  if (!scalable || CHOICE_WINDOW[choice] === 1) return sec;
  const scaled = Math.round((sec * CHOICE_WINDOW[choice]) / 30) * 30;
  return Math.max(Math.min(sec, MIN_WINDOW_SEC), scaled);
}

/**
 * Re-express a target in the substitute's unit, keeping the estimated work time: a 20 m crawl
 * becomes ~4 dead bugs, not "20 m of dead bug". Same-unit substitutions keep the number.
 */
export function convertTarget(
  unit: ExerciseUnit,
  target: number,
  original: Exercise,
  substitute: Exercise,
): { unit: ExerciseUnit; target: number } {
  if (substitute.unit === unit) return { unit, target };
  const sec = estimateItemSec(unit, target, false, original);
  let value: number;
  switch (substitute.unit) {
    case 'reps': {
      const perRep = num(substitute.secondsPerRep, DEFAULT_SECONDS_PER_REP);
      value = sec / (perRep > 0 ? perRep : DEFAULT_SECONDS_PER_REP);
      break;
    }
    case 'seconds':
      value = sec;
      break;
    case 'meters':
      value = sec * METERS_PER_SEC;
      break;
    case 'calories':
      value = sec / SEC_PER_CALORIE;
      break;
  }
  return { unit: substitute.unit, target: scaleTarget(substitute.unit, value, 1) };
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
  // Stored scales come back from JSON: never let a missing or NaN scale reach the targets.
  const scale = num(opts.scale, 1);
  const volumeScale = (multiplier: number) =>
    clamp(
      scale * multiplier * (deload ? DELOAD_VOLUME : 1),
      EFFECTIVE_SCALE_MIN,
      EFFECTIVE_SCALE_MAX,
    );
  const effectiveScale = volumeScale(CHOICE_VOLUME[choice]);
  const fortimeScale = volumeScale(CHOICE_VOLUME_FORTIME[choice]);
  // Set counts key off the athlete's own scale, without the choice: the choice adds its own set
  // delta, and folding it in here as well would move "harder" by two sets instead of one.
  const structuralScale = clamp(
    scale * (deload ? DELOAD_VOLUME : 1),
    EFFECTIVE_SCALE_MIN,
    EFFECTIVE_SCALE_MAX,
  );
  // Rest tracks the deload only — see CHOICE_SETS_DELTA in constants.ts for why the choice
  // deliberately leaves it alone.
  const restMultiplier = deload ? DELOAD_REST : 1;
  const ctx: SubstitutionContext = {
    profile: opts.profile,
    limitations,
    level: opts.level,
    choice,
    lookup: exerciseLookup,
  };

  const choiceBlocks = choiceSetBlockIds(workout);

  const blocks = workout.blocks.map((block) => {
    const scalable = block.scalable !== false;
    const blockScale = block.format === 'fortime' ? fortimeScale : effectiveScale;
    const s = scalable ? blockScale : 1;
    const restMul = scalable ? restMultiplier : 1;
    const sets = effectiveSets(
      block,
      structuralScale,
      scalable,
      choice,
      choiceBlocks.has(block.id),
    );
    // Warm-ups, cool-downs and tests keep the authored movement, not only the authored numbers.
    const blockCtx: SubstitutionContext = {
      ...ctx,
      allowHarderVariant: scalable && block.type !== 'test',
    };

    const items: PrescribedItem[] = block.items.map((item) => {
      const original = exerciseLookup(item.exerciseId);
      let exercise = original;
      let note: L10n | undefined;
      if (original) {
        const r = substituteExercise(original, item, blockCtx);
        exercise = r.exercise;
        note = r.note;
      }
      const given = givenUnit(item);
      let unit = given.unit;
      let target = scaleTarget(unit, given.value, s);
      // A substitute measured in another unit gets the same work time, not the same number.
      if (original && exercise && exercise.id !== original.id) {
        const converted = convertTarget(unit, target, original, exercise);
        unit = converted.unit;
        target = converted.target;
      }
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
    if (block.durationSec !== undefined) {
      // AMRAP has no sets to add; the window itself is the lever. For-time keeps its rounds, so
      // moving the cap only changes how much slack a slower athlete has.
      prescribed.durationSec = scaleWindow(block.durationSec, scalable, choice);
    }
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
    scale,
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
