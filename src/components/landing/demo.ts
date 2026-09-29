/**
 * Workout 1 of the free course as facts for the homepage, computed at build time with the real
 * training engine and the real `start` course. Returns null while the course content is missing so
 * the home page still builds.
 */
import { firstTrainableNode } from '@/app/features/courses/courseAccess';
import { COURSE_BY_ID, EXERCISE_BY_ID } from '@/content/registry';
import type { Course, Locale } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { ADAPTATION } from '@/lib/training/constants';
import { estimateDuration, estimateTrainingDuration, prescribeWorkout } from '@/lib/training';
import type { UserTrainingProfile } from '@/lib/training/types';
import { exerciseHref } from './courseHelpers';

export const DEMO_COURSE_ID = 'start';

/** A typical level-2 athlete: some experience, moderate activity, bodyweight only. */
export const DEMO_PROFILE: UserTrainingProfile = {
  ageBand: '25-34',
  sex: 'na',
  activityLevel: 'moderate',
  experience: 'beginner',
  tests: { pushups: 15, squats60s: 30, plankSec: 60 },
  limitations: [],
  equipment: ['none', 'mat'],
  timePerSessionMin: 30,
  goal: 'general',
};

/** One movement of workout 1, as the homepage names and links it. */
export interface FirstWorkoutMove {
  exerciseId: string;
  name: string;
  /** The coach's count from the course file (`start.ts`), not a scaled prescription. */
  reps: number | undefined;
  /** The movement's own page, `/exercises/<slug>/`, when it has one. */
  href: string | undefined;
}

/** The facts the homepage states about workout 1 — every one read from content or the engine. */
export interface FirstWorkoutFacts {
  courseId: string;
  workoutId: string;
  /** «Тренировка 1» and its real subtitle, «По таймеру, 3 движения». */
  nodeTitle: string;
  nodeSubtitle: string;
  /**
   * The training blocks' clock, warm-up and cool-down excluded: the engine's estimate, whole
   * minutes. It runs the rest minutes between rounds too, so it is not the minutes of work.
   */
  workMinutes: number;
  /**
   * The whole workout, warm-up and cool-down included: `estimateDuration`, whole minutes. An EMOM
   * runs on the clock, so this is the same for every difficulty choice (the test holds that).
   */
  totalMinutes: number;
  /**
   * Whole passes through the movements in the main block, as the player runs it: an EMOM's count
   * is minutes, one movement a minute (`estimate.ts`, `buildPlayerSteps`), so this is the
   * prescribed minutes over the movements — not the authored `rounds`, which an EMOM spends as
   * minutes. The copy says «круг» only as many times as this.
   */
  cycles: number;
  /**
   * The player's «Минута 1 из N»: the main block's prescribed work minutes. Not `workMinutes`,
   * which also holds the rest minute between rounds (s01 is 9 work minutes over an 11-minute clock).
   */
  playerMinutes: number;
  moves: FirstWorkoutMove[];
  /** What «Легко» does to the next workout, in whole percent (+5): `ADAPTATION.easyDelta`. */
  easyDeltaPercent: number;
}

/**
 * The «Тренировка 1» section's intro sentence. Its «минут работы» is {@link
 * FirstWorkoutFacts.playerMinutes}, the minutes something is done, and not `workMinutes`, whose
 * clock also runs the rest minutes between rounds.
 */
export function firstWorkoutIntro(locale: Locale, facts: FirstWorkoutFacts): string {
  return t(locale, 'landing.firstIntro', {
    work: t(locale, 'common.minutesShort', { n: facts.playerMinutes }),
    total: facts.totalMinutes,
  });
}

/**
 * Workout 1 of the free course, as facts for the homepage's «Тренировка 1» section.
 *
 * The node is the one the app opens for free (`firstTrainableNode`, the rule 0022 enforces), so
 * the page describes the workout a visitor actually lands on. The minutes are
 * `estimateTrainingDuration(prescribeWorkout(…))` — training blocks only, the same figure the
 * app's difficulty sheet shows. Workout 1 is an EMOM, so the time is set by the clock and not by
 * the athlete: it comes out the same for every difficulty choice, which is what lets the page
 * print one number (the test holds that). Never typed by hand: change the minutes in `start.ts`
 * and the sentence follows.
 *
 * Null while the course or its first workout is missing, so the page still builds.
 */
export function firstWorkoutFacts(locale: Locale, course?: Course): FirstWorkoutFacts | null {
  const c = course ?? COURSE_BY_ID.get(DEMO_COURSE_ID);
  if (!c) return null;
  const node = firstTrainableNode(c);
  const workout = node?.workoutId ? c.workouts.find((w) => w.id === node.workoutId) : undefined;
  if (!node || !workout) return null;
  const main = workout.blocks.find((b) => b.type !== 'warmup' && b.type !== 'cooldown');
  if (!main) return null;

  const prescribed = prescribeWorkout(workout, {
    profile: DEMO_PROFILE,
    scale: 1,
    choice: 'normal',
    level: 2,
  });
  const workMinutes = Math.max(1, Math.round(estimateTrainingDuration(prescribed).totalSec / 60));
  const totalMinutes = Math.max(1, Math.round(estimateDuration(prescribed).totalSec / 60));
  const mainPrescribed = prescribed.blocks.find((b) => b.blockId === main.id);
  const movements = Math.max(1, main.items.length);
  const cycles = Math.max(1, Math.floor((mainPrescribed?.sets ?? movements) / movements));

  return {
    courseId: c.id,
    workoutId: workout.id,
    nodeTitle: l(node.title, locale),
    nodeSubtitle: l(node.subtitle, locale),
    workMinutes,
    totalMinutes,
    cycles,
    playerMinutes: Math.max(1, mainPrescribed?.sets ?? movements),
    moves: main.items.map((it) => {
      const ex = EXERCISE_BY_ID.get(it.exerciseId);
      return {
        exerciseId: it.exerciseId,
        name: ex ? l(ex.name, locale) : it.exerciseId,
        reps: it.reps,
        href: ex ? exerciseHref(locale, ex) : undefined,
      };
    }),
    easyDeltaPercent: Math.round(ADAPTATION.easyDelta * 100),
  };
}
