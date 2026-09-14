/**
 * What this person comfortably does, per movement — the quantity the whole adaptation rests on.
 *
 * The engine used to carry one number per course: a `scale` from 0.5 to 1.5 that multiplied every
 * authored rep of every workout. It cannot describe a person. Someone with a strong press, weak
 * legs and an excellent trunk is not "×0.8 of the programme" — they are three different athletes
 * depending on which movement is on screen, and one multiplier flattens all of it.
 *
 * WHY COMFORT AND NOT A MAXIMUM. The obvious model stores reps-to-failure and prescribes a fraction
 * of it. It was the first draft, and the owner rejected it for a good reason: to fill it in you have
 * to ask people to max out, and a programme built on maxima comes out too hard. So the stored
 * quantity is the one a person can actually answer without a stopwatch and a grudge — «сколько
 * делаешь, чтобы было комфортно» — and the three modes are arithmetic on top of it:
 *
 *     полегче   = comfort          (what you already do)
 *     нормально = comfort + 20 %   (a small challenge)
 *     посложнее = comfort + 40 %   (a real one)
 *
 * That +20 % lands in the region the RIR literature calls two to three repetitions in reserve,
 * where adaptation happens without training to failure (Zourdos et al. 2016; Helms et al. 2016).
 * Nothing here ever asks anyone to go to failure, which is also why there is no max-effort probe:
 * an earlier draft had one, and it contradicted the rule it was meant to serve.
 *
 * Everything in this file is pure: no I/O, no clock, no storage. Timestamps and rows are the
 * caller's problem, as everywhere else in `src/lib/training`.
 */
import type { Exercise, Level, MovementPattern } from '@/content/schema';
import {
  COMFORT_ALPHA_MAX,
  COMFORT_ALPHA_MIN,
  COMFORT_INFERRED_MAX,
  COMFORT_INFERRED_MIN,
  COMFORT_MODE,
  COMFORT_RATIO_MAX,
  COMFORT_RATIO_MIN,
  COMFORT_SESSION_MAX_DOWN,
  COMFORT_SESSION_MAX_UP,
  COMFORT_SHRINK,
  TWO_FOR_TWO_GAIN,
} from './constants';
import type { DifficultyChoice } from './types';
import { clamp } from './util';

/** What the athlete comfortably does in one movement, and how sure of it we are. */
export interface ComfortEntry {
  /** Reps, or seconds for a hold. Always the *comfortable* figure, never a maximum. */
  comfort: number;
  /** How many usable observations are behind it. Drives the learning rate, not the value. */
  observations: number;
}

export type ComfortMap = Readonly<Record<string, ComfortEntry>>;

/** Everything `comfortFor` needs to know about the library, without importing it. */
export interface ComfortLookup {
  exercise(id: string): Exercise | undefined;
}

/**
 * How a comfort figure was arrived at — carried so the UI and the tests can tell a measurement
 * from a guess, and so the shrinkage below can be applied at the right strength.
 */
export type ComfortSource = 'observed' | 'pattern' | 'reference';

export interface Comfort {
  value: number;
  source: ComfortSource;
  /** Comfort ÷ the standard person's comfort for this movement at this level. 1 = the average. */
  ratio: number;
}

/* ---------------------------------------------------------------------------------------------
 * The reference athlete
 * ------------------------------------------------------------------------------------------- */

/**
 * What a standard person at this course's level comfortably does.
 *
 * Authored on the exercise, once, per level — deliberately NOT read off a workout's authored number.
 * That was a real bug in the first design: sit-ups are authored at 8 in workout 3 of «Старт» and at
 * 10 in workout 6 because the coach intends different things in a for-time triplet and in an
 * eight-minute AMRAP. Deriving a reference from each of them made the standard beginner's comfort
 * flap between 11 and 18, and every ratio computed from it was noise.
 *
 * Missing entries fall back to the nearest level that has one, then to the authored number itself
 * (ratio 1), which is the honest answer when nobody has said what average looks like.
 */
export function referenceComfort(exercise: Exercise | undefined, level: Level): number | undefined {
  const table = exercise?.comfortRef;
  if (!table) return undefined;
  const exact = table[level];
  if (typeof exact === 'number' && exact > 0) return exact;
  // Nearest level with a number: a level-2 reference is a better guess than none at all.
  for (const near of [level - 1, level + 1, level - 2, level + 2]) {
    const v = table[near as Level];
    if (typeof v === 'number' && v > 0) return v;
  }
  return undefined;
}

/* ---------------------------------------------------------------------------------------------
 * Reading a comfort for a movement the athlete may never have done
 * ------------------------------------------------------------------------------------------- */

/**
 * The athlete's comfort in one movement, falling back down a hierarchy when it has not been seen.
 *
 *     the exercise's own observations  →  its movement pattern  →  the reference athlete
 *
 * A pattern-level fallback is shrunk, and a cross-pattern one is shrunk hard. A plank is an
 * anti-extension hold and a sit-up is trunk flexion; someone who holds a plank for three minutes
 * has earned *some* confidence on sit-ups and nowhere near all of it. The shrinkage factors are
 * expert anchors, not measurements, and they are deliberately timid: a wrong guess that is close to
 * average costs one session, and a wrong guess that is far from it costs a customer.
 */
export function comfortFor(
  exerciseId: string,
  map: ComfortMap,
  level: Level,
  lookup: ComfortLookup,
): Comfort {
  const exercise = lookup.exercise(exerciseId);
  const ref = referenceComfort(exercise, level);

  const own = map[exerciseId];
  if (own && own.comfort > 0) {
    const ratio = ref ? clamp(own.comfort / ref, COMFORT_RATIO_MIN, COMFORT_RATIO_MAX) : 1;
    return { value: own.comfort, source: 'observed', ratio };
  }

  // Nothing for this movement. Borrow the athlete's standing in the rest of its pattern.
  const pattern = exercise?.pattern;
  const borrowed = pattern ? patternRatio(pattern, map, level, lookup) : undefined;
  if (borrowed !== undefined && ref) {
    const shrunk = shrinkRatio(borrowed.ratio, borrowed.samePattern);
    return { value: ref * shrunk, source: 'pattern', ratio: shrunk };
  }

  // Nothing anywhere. The standard person is the honest answer.
  return { value: ref ?? 0, source: 'reference', ratio: 1 };
}

/**
 * Pull a ratio toward 1 by how far the evidence had to travel to get here.
 *
 * `λ = 1` would mean "a superb plank makes you superb at sit-ups", which is not true of bodies.
 */
function shrinkRatio(ratio: number, samePattern: boolean): number {
  const lambda = samePattern ? COMFORT_SHRINK.samePattern : COMFORT_SHRINK.crossPattern;
  const pulled = 1 + lambda * (ratio - 1);
  return clamp(pulled, COMFORT_INFERRED_MIN, COMFORT_INFERRED_MAX);
}

/**
 * How this athlete stands relative to average across everything we have seen them do, preferring
 * movements in the same pattern and falling back to the whole record.
 *
 * Each observation is weighted by its own confidence, so one hesitant guess never outvotes a
 * movement the person has done six times.
 */
function patternRatio(
  pattern: MovementPattern,
  map: ComfortMap,
  level: Level,
  lookup: ComfortLookup,
): { ratio: number; samePattern: boolean } | undefined {
  let sameSum = 0;
  let sameWeight = 0;
  let anySum = 0;
  let anyWeight = 0;

  for (const [id, entry] of Object.entries(map)) {
    if (!entry || entry.comfort <= 0) continue;
    const ex = lookup.exercise(id);
    const ref = referenceComfort(ex, level);
    if (!ref) continue;
    const ratio = clamp(entry.comfort / ref, COMFORT_RATIO_MIN, COMFORT_RATIO_MAX);
    const weight = Math.max(1, entry.observations);
    anySum += ratio * weight;
    anyWeight += weight;
    if (ex?.pattern === pattern) {
      sameSum += ratio * weight;
      sameWeight += weight;
    }
  }

  if (sameWeight > 0) return { ratio: sameSum / sameWeight, samePattern: true };
  if (anyWeight > 0) return { ratio: anySum / anyWeight, samePattern: false };
  return undefined;
}

/* ---------------------------------------------------------------------------------------------
 * Turning a comfort into the number on screen
 * ------------------------------------------------------------------------------------------- */

/**
 * The coach's number, bent for this athlete and shifted by the mode.
 *
 *     target = authored × ratio × modeFactor,  clamped to the coach's own range
 *
 * THE INVARIANT THAT MATTERS: at ratio 1 — an athlete exactly average for the course's level — this
 * returns the authored number untouched at «нормально». Sergey's programme is honoured exactly for
 * the person he wrote it for, and bends only for people who differ from that person. There is a
 * test for it, and it should never be allowed to fail.
 *
 * `min` / `max` are the coach's own range, the one he already writes in prose under each movement
 * («Тренер: 10–20»). They are hard: an unbounded model walks away from the programme, and the
 * example that proved it produced 50 dead bugs against an authored 30 and a written ceiling of 40.
 */
export function targetFor(
  authored: number,
  ratio: number,
  choice: DifficultyChoice,
  bounds?: { min?: number | undefined; max?: number | undefined },
): number {
  if (!Number.isFinite(authored) || authored <= 0) return Math.max(1, Math.round(authored || 1));
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  const raw = authored * safeRatio * COMFORT_MODE[choice];
  const lo = Math.max(1, bounds?.min ?? 1);
  const hi = bounds?.max ?? Number.POSITIVE_INFINITY;
  return Math.round(clamp(Math.round(raw), lo, Math.max(lo, hi)));
}

/* ---------------------------------------------------------------------------------------------
 * Learning from what came back
 * ------------------------------------------------------------------------------------------- */

/** One movement's worth of evidence from a finished session. */
export interface ComfortObservation {
  exerciseId: string;
  /** What the athlete was asked for. */
  target: number;
  /** What they entered. */
  achieved: number;
  choice: DifficultyChoice;
  /**
   * True when the number is a real measurement rather than a target that was met — an AMRAP round
   * count, a test block. These are the only observations that are not censored from above.
   */
  measured?: boolean;
}

export interface ComfortUpdate {
  exerciseId: string;
  before: number;
  after: number;
  /** Why it moved, for the log and for the tests. */
  reason: 'short' | 'over' | 'measured' | 'two-for-two' | 'hard-session' | 'hold';
}

/**
 * THE CENSORING PROBLEM, AND WHY THIS IS NOT A ONE-LINER.
 *
 * The rep stepper opens *on the target* (`WorkRepsStep.tsx`) and the path of least resistance is to
 * tap «Готово» without touching it. So when the target is 12 and 12 comes back, the only thing
 * learned is *comfort ≥ 12*. That is a right-censored observation, and a model that reads it as
 * "comfort = 12" ratchets everyone down to whatever it first guessed and never recovers.
 *
 * Four cases, and only three of them move anything:
 *
 *   fewer than asked  →  comfort is BELOW this. Unambiguous; believed immediately, and applied as a
 *                        ceiling as well as an update. Failing is the one signal nobody fakes.
 *   more than asked   →  comfort is ABOVE this. Nobody does extra reps by accident.
 *   a measurement     →  strongest. An AMRAP round count or a test block is not censored.
 *   exactly as asked  →  a lower bound and nothing else. It moves comfort only through the
 *                        two-for-two rule below, never on its own.
 *
 * The learning rate falls as observations accumulate (`α = 1/(n+2)`), so an early reading moves the
 * estimate a long way and a late one nudges it — which is what confidence is supposed to mean.
 */
export function updateComfort(
  entry: ComfortEntry | undefined,
  obs: ComfortObservation,
): { entry: ComfortEntry; update: ComfortUpdate } {
  const mode = COMFORT_MODE[obs.choice] || 1;
  const before = entry?.comfort ?? obs.target / mode;
  const observations = entry?.observations ?? 0;
  const observed = obs.achieved / mode;

  const hold = (reason: ComfortUpdate['reason']) => ({
    entry: { comfort: before, observations },
    update: { exerciseId: obs.exerciseId, before, after: before, reason },
  });

  if (!Number.isFinite(obs.achieved) || obs.achieved <= 0) return hold('hold');

  const short = obs.achieved < obs.target;
  const over = obs.achieved > obs.target;
  if (!short && !over && !obs.measured) return hold('hold');

  const alpha = clamp(1 / (observations + 2), COMFORT_ALPHA_MIN, COMFORT_ALPHA_MAX);
  let next = before + alpha * (observed - before);

  // A shortfall pulls to what actually happened rather than politely averaging toward it. The step
  // clamp below still applies — but it is asymmetric, so this drops decisively instead of inching.
  if (short) next = Math.min(next, observed);

  next = clampStep(before, next);
  const reason: ComfortUpdate['reason'] = obs.measured ? 'measured' : short ? 'short' : 'over';
  return {
    entry: { comfort: next, observations: observations + 1 },
    update: { exerciseId: obs.exerciseId, before, after: next, reason },
  };
}

/**
 * The two-for-two rule: hitting the target on two consecutive sessions, both of them easy, earns a
 * small rise.
 *
 * This is the standard coaching answer to exactly the censoring problem above (Baechle & Earle,
 * _Essentials of Strength Training and Conditioning_): when you cannot see past the target, use
 * repetition of the target as the evidence instead. Two sessions, not one, because a single easy
 * day is a good night's sleep.
 */
export function twoForTwo(entry: ComfortEntry): { entry: ComfortEntry; update: ComfortUpdate } {
  const before = entry.comfort;
  const after = clampStep(before, before * (1 + TWO_FOR_TWO_GAIN));
  return {
    entry: { comfort: after, observations: entry.observations + 1 },
    update: { exerciseId: '', before, after, reason: 'two-for-two' },
  };
}

/**
 * A session that hurt pulls everything it touched down.
 *
 * This is the global term the engine already had (`adaptScale`), kept as a global term: RPE and
 * feeling are reported once for the whole session, so they cannot say *which* movement was the hard
 * one. They may lower, and they may never raise — a painful session must never earn an increase.
 */
export function hardSession(entry: ComfortEntry, factor: number): ComfortEntry {
  const f = clamp(factor, 1 - COMFORT_SESSION_MAX_DOWN, 1);
  return { comfort: Math.max(1, entry.comfort * f), observations: entry.observations };
}

/**
 * No single session may move a comfort further than this — further down than up, on purpose.
 * See COMFORT_SESSION_MAX_DOWN: being too hard and being too easy do not cost the same thing.
 */
function clampStep(before: number, next: number): number {
  const lo = before * (1 - COMFORT_SESSION_MAX_DOWN);
  const hi = before * (1 + COMFORT_SESSION_MAX_UP);
  return Math.max(1, clamp(next, lo, hi));
}
