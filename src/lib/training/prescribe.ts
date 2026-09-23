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
  FILMED_FALLBACK_VOLUME,
  HYPERTENSION_MAX_HOLD_SEC,
  ISOMETRIC_ID_PATTERN,
  KNEE_RISKY_IDS,
  LOWER_BACK_RISKY_IDS,
  MAX_CHOICE_SET_BLOCKS,
  MAX_SETS_ADDED,
  METERS_PER_SEC,
  MIN_FORMAT_ROUNDS,
  MIN_ROUNDS_EASIER_CIRCUIT,
  MIN_SECONDS_TARGET,
  MIN_SETS_AFTER_REMOVE,
  MIN_SETS_EASIER,
  MIN_WINDOW_SEC,
  ON_HANDS_ID_PATTERN,
  TWO_SIDED_ID_PATTERN,
  OVERHEAD_ID_PATTERN,
  SEC_PER_CALORIE,
  SETS_ADD_AT,
  SETS_REMOVE_AT,
  SUBSTITUTE_REPS_FACTOR,
  TABATA_DEFAULT_ROUNDS,
  WINDOW_STEP_SEC,
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

/**
 * Done one side at a time — a lunge, a step-up, a skater, a single-arm press.
 *
 * The content library's `unilateral` tag is the primary source; the id pattern catches a movement
 * added later without it. Nothing here reads `perSide`: that is a property of how a *workout*
 * asks for the movement, not of the movement itself.
 */
export function isTwoSided(exercise: Exercise): boolean {
  return exercise.tags.includes('unilateral') || TWO_SIDED_ID_PATTERN.test(exercise.id);
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

/** Does the coach have a clip of this movement? (A lookup without media counts as not filmed.) */
function isFilmedExercise(exercise: Exercise): boolean {
  return Boolean(exercise.video);
}

/** The old four-step walk over one chain (original first): see `substituteExercise`. */
function pickFromChain(
  chain: readonly Exercise[],
  issues: readonly ReadonlySet<Issue>[],
): { exercise: Exercise; note?: L10n } {
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
  return { exercise: chain[0]!, note: PRESCRIBE_NOTE.equipmentNeeded };
}

/** Cannot be done as prescribed at all: no equipment, or it hits a limitation. */
function isUnsafe(issues: ReadonlySet<Issue>): boolean {
  return issues.has('equipment') || issues.has('limitation');
}

export interface Substitution {
  exercise: Exercise;
  note?: L10n;
  /**
   * The engine wanted an easier (or harder) variant but kept the filmed original because the
   * variant has no clip: the caller moves the target instead (FILMED_FALLBACK_VOLUME).
   */
  fallback?: 'easier' | 'harder';
}

/**
 * Resolve the exercise actually prescribed for an item.
 * Walks `scaling.easier` (2 steps) when the original is unsuitable; uses `scaling.harder`
 * (1 step) for confident level-3 athletes on bodyweight moves.
 *
 * **A filmed movement is not swapped for an unfilmed one** — the whole beginner course plays with
 * the coach's own clips, and a substitute without one is a black card with a name on it. When the
 * original has a clip, candidates without one are skipped; if that leaves nothing better than the
 * original, the original stays and `fallback` tells the caller to move the target instead.
 *
 * **Safety beats video.** The one exception: when every filmed candidate still hits the athlete's
 * limitation (or needs equipment they lack) and an unfilmed one does not, the unfilmed one is
 * prescribed. Losing the clip is a worse screen; loading sore wrists is a worse outcome. When the
 * unfilmed variant is no safer (knee push-up → incline push-up is on the hands too), the filmed
 * original stays, with its caution note.
 */
export function substituteExercise(
  original: Exercise,
  item: Pick<WorkoutItem, 'load'>,
  ctx: SubstitutionContext,
): Substitution {
  const keepFilm = isFilmedExercise(original);
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
      if (harder && issuesOf(harder, item.load, ctx).size === 0) {
        if (!keepFilm || isFilmedExercise(harder)) return { exercise: harder };
        return { exercise: original, fallback: 'harder' };
      }
    }
    return { exercise: original };
  }

  const chain = easierChain(original, ctx.lookup, 2);
  const issues = chain.map((e) => issuesOf(e, item.load, ctx));
  const ideal = pickFromChain(chain, issues);
  if (!keepFilm || isFilmedExercise(ideal.exercise)) return ideal;

  const filmedIdx = [...chain.keys()].filter((i) => isFilmedExercise(chain[i]!));
  const filmed = pickFromChain(
    filmedIdx.map((i) => chain[i]!),
    filmedIdx.map((i) => issues[i]!),
  );
  const idealIssues = issues[chain.indexOf(ideal.exercise)]!;
  const filmedIssues = issues[chain.indexOf(filmed.exercise)]!;
  if (isUnsafe(filmedIssues) && !isUnsafe(idealIssues)) return ideal;
  return filmed.exercise.id === original.id ? { ...filmed, fallback: 'easier' } : filmed;
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

/**
 * A two-sided movement counted as a total must come out even.
 *
 * Lunges, step-ups, skaters, bird dogs and single-arm work alternate sides, and the number the
 * athlete is given is the total across both. An odd total means one side gets a rep the other
 * does not — eleven lunges is six left and five right — and repeated three sets a session, three
 * sessions a week, that is a limp the programme built in.
 *
 * The authored numbers are almost all even because whoever wrote them counted in pairs. The
 * engine is what breaks it: an authored 20 at a beginner's scale of 0.65 rounds to 13. So the
 * rule lives here, where the scaling happens, and it holds at every scale and every difficulty.
 *
 * It rounds to the nearest even number and never below two, so the movement survives at the
 * smallest scale with one rep a side rather than disappearing.
 *
 * An item marked `perSide` is exempt: its number is already per side, the athlete does it twice,
 * and the total is even whatever the number is. Forcing that one even would double the work.
 */
export function evenTarget(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
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
      // A circuit that IS the work (not a core or skill accessory) keeps two rounds on «полегче»:
      // one round of a two-round session is a different, three-minute session.
      const mainCircuit =
        block.format === 'circuit' && block.type !== 'core' && block.type !== 'skill';
      const easierFloor = mainCircuit ? MIN_ROUNDS_EASIER_CIRCUIT : MIN_SETS_EASIER;
      const floor = Math.min(base, choice === 'easier' ? easierFloor : MIN_SETS_AFTER_REMOVE);
      return clamp(base + fromScale + fromChoice, floor, base + MAX_SETS_ADDED);
    }
    case 'emom':
      return emomMinutes(block.rounds ?? 1, block.items.length, scalable, choice);
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
 * EMOM minutes. The player gives each minute to the next movement in turn, so a scaled count that
 * is not a multiple of the movements either repeats one («4 минуты на 3 движения») or drops the
 * last. Scaled minutes snap to the nearest whole cycle — never below one cycle (nor the format's
 * floor), never past the authored count in the wrong direction. The authored count at «как
 * обычно» is left alone.
 */
function emomMinutes(
  rounds: number,
  movements: number,
  scalable: boolean,
  choice: DifficultyChoice,
): number {
  if (movements <= 1) return scaleRounds(rounds, scalable, choice);
  if (!scalable || CHOICE_WINDOW[choice] === 1) return rounds;
  const cycles = (m: number) => Math.round(m / movements) * movements;
  const floor = Math.ceil(Math.min(rounds, MIN_FORMAT_ROUNDS) / movements) * movements;
  const snapped = Math.max(movements, floor, cycles(rounds * CHOICE_WINDOW[choice]));
  return choice === 'easier' ? Math.min(rounds, snapped) : Math.max(rounds, snapped);
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
 * AMRAP / for-time window, moved by the choice and rounded to a whole minute (WINDOW_STEP_SEC):
 * the player and the summaries show it in minutes, and a 390 s window read as «7 мин».
 * "As usual" returns the authored number untouched: rounding an authored 200 s cap would quietly
 * change it even when the athlete asked for no change at all.
 */
function scaleWindow(sec: number, scalable: boolean, choice: DifficultyChoice): number {
  if (!scalable || CHOICE_WINDOW[choice] === 1) return sec;
  const scaled = Math.round((sec * CHOICE_WINDOW[choice]) / WINDOW_STEP_SEC) * WINDOW_STEP_SEC;
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

/**
 * «Максимум повторений за N минут»: an AMRAP of exactly one movement counted in reps. Its reps are
 * the whole goal rather than one round, and the player counts reps instead of rounds.
 */
export function isMaxRepsBlock(block: Pick<Block, 'format' | 'items'>): boolean {
  return block.format === 'amrap' && block.items.length === 1 && block.items[0]!.reps !== undefined;
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

  const blocks = workout.blocks.map((block, blockIndex) => {
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
    // A block that does not scale is the same whatever the choice — its substitutions included,
    // so the level check runs as if the athlete had picked «как обычно».
    const blockCtx: SubstitutionContext = {
      ...ctx,
      choice: scalable ? choice : 'normal',
      allowHarderVariant: scalable && block.type !== 'test',
    };
    // «Полегче» on an EMOM: the minutes cannot give much (a whole cycle or nothing), so the reps
    // must — never the same number as «как обычно» (below).
    const emomEasier = scalable && block.format === 'emom' && choice === 'easier';
    // An AMRAP of one movement is «максимум повторений за N минут»: the authored reps are the
    // total goal (s04: 100 bridges in 5 minutes), the window is the test and never moves.
    const maxReps = isMaxRepsBlock(block);
    const normalScale = volumeScale(CHOICE_VOLUME.normal);

    const items: PrescribedItem[] = block.items.map((item) => {
      const original = exerciseLookup(item.exerciseId);
      let exercise = original;
      let note: L10n | undefined;
      let fallback: Substitution['fallback'];
      if (original) {
        const r = substituteExercise(original, item, blockCtx);
        exercise = r.exercise;
        note = r.note;
        fallback = r.fallback;
      }
      const substituted = !!original && !!exercise && exercise.id !== original.id;
      const perSide = item.perSide === true;
      const given = givenUnit(item);
      /** The whole target pipeline at one volume scale. */
      const targetAt = (volume: number): { unit: ExerciseUnit; target: number; even: boolean } => {
        let unit = given.unit;
        let target = scaleTarget(unit, given.value, volume);
        let even = unit === 'reps' && !perSide && !!exercise && isTwoSided(exercise);
        // A substitute measured in another unit gets the same work time, not the same number.
        if (substituted) {
          const converted = convertTarget(unit, target, original!, exercise!);
          unit = converted.unit;
          target = converted.target;
          const pair = SUBSTITUTE_REPS_FACTOR[`${original!.id}>${exercise!.id}`];
          if (pair && unit === 'reps') {
            target = Math.max(1, Math.round(target * pair.factor));
            even ||= pair.even && !perSide;
          }
        }
        if (
          limitations.has('hypertension') &&
          unit === 'seconds' &&
          exercise &&
          isIsometricHold(exercise)
        ) {
          target = Math.min(target, HYPERTENSION_MAX_HOLD_SEC);
        }
        /*
         * Two-sided and counted as a total: make it even so both sides get the same work.
         * `perSide` items are already per side and are left alone — see `evenTarget`.
         */
        if (unit === 'reps' && even) target = evenTarget(target);
        return { unit, target, even };
      };
      const pairFactor =
        (substituted && SUBSTITUTE_REPS_FACTOR[`${original!.id}>${exercise!.id}`]?.factor) || 1;
      // The filmed original kept in place of an unfilmed variant moves its number instead.
      const fallbackMul = scalable && fallback ? FILMED_FALLBACK_VOLUME[fallback] : 1;
      const prescribedTarget = targetAt(s * fallbackMul);
      const unit = prescribedTarget.unit;
      let target = prescribedTarget.target;
      if (maxReps && unit === 'reps') {
        // A goal of 100, not 97: round to 5 (and keep a two-sided count even).
        target = Math.max(5, round5(target));
        if (prescribedTarget.even && target % 2 === 1) target += 5;
      }
      if (emomEasier && unit === 'reps') {
        const step = prescribedTarget.even ? 2 : 1;
        const usual = targetAt(normalScale).target;
        if (usual > step && target > usual - step) target = usual - step;
      }
      const loadLabel = exercise ? effectiveLoadLabel(exercise, item.load, limitations) : item.load;
      const loadKg =
        exercise && exercise.loadable && loadLabel
          ? pickLoadKg(exercise, loadLabel, opts.profile)
          : undefined;

      const out: PrescribedItem = {
        exerciseId: exercise?.id ?? item.exerciseId,
        originalExerciseId: item.exerciseId,
        substituted,
        unit,
        target,
        perSide,
        restAfterSec: scaleRest(item.restAfterSec, restMul),
        // A doubled dead-bug count is the coach's equivalent of the sit-ups, not twice the work:
        // one rep a side, so the clock sees the time of the original number.
        estimatedSec: estimateItemSec(unit, target, perSide, exercise) / pairFactor,
      };
      if (loadLabel) out.loadLabel = loadLabel;
      if (loadKg !== undefined) out.loadKg = loadKg;
      // The authored note is a cue for the authored movement («не тяни себя за шею» on a sit-up):
      // on a substitute it would describe the wrong exercise. The substitute's own cues are on
      // the card.
      const finalNote = joinNotes(note, substituted ? undefined : item.note);
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
      // moving the cap only changes how much slack a slower athlete has. A max-reps AMRAP keeps
      // its window: its goal moves instead.
      prescribed.durationSec = maxReps
        ? block.durationSec
        : scaleWindow(block.durationSec, scalable, choice);
    }
    if (block.workSec !== undefined) prescribed.workSec = block.workSec;
    // A pause after the whole block, before the next one. Never after the last block: there is
    // nothing to rest for, and the player would end on a countdown.
    if (block.restAfterSec && blockIndex < workout.blocks.length - 1) {
      const rest = scaleRest(block.restAfterSec, restMul);
      if (rest > 0) prescribed.restAfterSec = rest;
    }
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
    }),
  };
}
