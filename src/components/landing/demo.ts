/**
 * Builds the props of the <DifficultyDemo> island at build time with the real training engine and
 * the real `start` course: three prescriptions (easier / normal / harder) and four post-workout
 * scenarios showing how the next load adapts. Returns null while the course content is missing so
 * the home page still builds.
 */
import { firstTrainableNode } from '@/app/features/courses/courseAccess';
import { COURSE_BY_ID, EXERCISE_BY_ID } from '@/content/registry';
import type { Course, Locale } from '@/content/schema';
import { formatNumber, l, plural, t } from '@/i18n/index';
import { ADAPTATION } from '@/lib/training/constants';
import {
  adaptScale,
  blockEmomRounds,
  estimateDuration,
  estimateTrainingDuration,
  estimatePoints,
  prescribeWorkout,
  recommendDifficulty,
} from '@/lib/training';
import type {
  CourseState,
  DifficultyChoice,
  Feeling,
  PrescribedBlock,
  SessionSummary,
  UserTrainingProfile,
} from '@/lib/training/types';
import type { DemoBlock, DemoChoice, DemoScenario, DifficultyDemoProps } from './DifficultyDemo';
import { exerciseHref, sampleWorkout } from './courseHelpers';

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

const CHOICES: DifficultyChoice[] = ['easier', 'normal', 'harder'];

const SCENARIOS: { id: string; rpe: number; feeling: Feeling; completion: number }[] = [
  { id: 'easy', rpe: 5, feeling: 'great', completion: 1 },
  { id: 'ok', rpe: 7, feeling: 'ok', completion: 0.95 },
  { id: 'hard', rpe: 9, feeling: 'hard', completion: 0.85 },
  { id: 'pain', rpe: 7, feeling: 'pain', completion: 0.9 },
];

function choiceLabel(locale: Locale, choice: DifficultyChoice): string {
  switch (choice) {
    case 'easier':
      return t(locale, 'training.difficultyEasier');
    case 'normal':
      return t(locale, 'training.difficultyNormal');
    case 'harder':
      return t(locale, 'training.difficultyHarder');
  }
}

function scenarioLabel(locale: Locale, id: string): string {
  switch (id) {
    case 'easy':
      return t(locale, 'landing.adaptRpeEasy');
    case 'ok':
      return t(locale, 'landing.adaptRpeOk');
    case 'hard':
      return t(locale, 'landing.adaptRpeHard');
    default:
      return t(locale, 'landing.adaptRpePain');
  }
}

/** «3 раунда» / «1 подход»: the same pluralised count as `blockMetaLabel` in courseHelpers. */
function countLabel(locale: Locale, stem: 'set' | 'round', n: number): string {
  const word = plural(locale, n, {
    one: t(locale, `landing.${stem}WordOne`),
    few: t(locale, `landing.${stem}WordFew`),
    many: t(locale, `landing.${stem}WordMany`),
  });
  return t(locale, stem === 'set' ? 'landing.blockSets' : 'landing.blockRounds', { n, word });
}

function blockMeta(locale: Locale, b: PrescribedBlock): string {
  const format = t(locale, `training.format_${b.format}`);
  switch (b.format) {
    case 'sets':
      return `${format} · ${countLabel(locale, 'set', b.sets)}`;
    case 'circuit':
      return `${format} · ${countLabel(locale, 'round', b.sets)}`;
    case 'amrap':
    case 'fortime':
      return `${format} · ${t(locale, 'landing.blockMinutes', {
        n: Math.round((b.durationSec ?? b.estimatedSec) / 60),
      })}`;
    case 'emom': {
      // With a rest between passes: «3 круга · 11 мин», the minutes being the whole clock.
      const passes = blockEmomRounds(b);
      if (passes) {
        return `${format} · ${countLabel(locale, 'round', passes.rounds)} · ${t(
          locale,
          'landing.blockMinutes',
          { n: Math.round(passes.totalSec / 60) },
        )}`;
      }
      return `${format} · ${t(locale, 'landing.blockMinutes', { n: b.sets })}`;
    }
    case 'tabata':
    case 'interval':
      return `${format} · ${t(locale, 'landing.blockTabata', {
        work: b.workSec ?? 0,
        rest: b.restSec ?? 0,
        n: b.sets,
      })}`;
  }
}

function toDemoBlocks(locale: Locale, blocks: PrescribedBlock[]): DemoBlock[] {
  return blocks.map((b) => ({
    id: b.blockId,
    title: b.title ? l(b.title, locale) : t(locale, `training.block_${b.type}`),
    meta: blockMeta(locale, b),
    items: b.items.map((it) => {
      const ex = EXERCISE_BY_ID.get(it.exerciseId);
      return {
        name: ex ? l(ex.name, locale) : it.exerciseId,
        target: it.target,
        unit: t(locale, `training.${it.unit}`),
        perSide: it.perSide ? t(locale, 'training.perSide') : '',
        load: it.loadLabel ? t(locale, `training.load_${it.loadLabel}`) : '',
        substituted: it.substituted,
      };
    }),
  }));
}

export function buildDemo(locale: Locale, course?: Course): DifficultyDemoProps | null {
  const c = course ?? COURSE_BY_ID.get(DEMO_COURSE_ID);
  if (!c) return null;
  const workout = sampleWorkout(c);
  if (!workout) return null;

  const state: CourseState = { scale: 1, history: [], completedNodeIds: [] };
  const nowIso = new Date().toISOString();

  const choices: DemoChoice[] = CHOICES.map((choice) => {
    const p = prescribeWorkout(workout, {
      profile: DEMO_PROFILE,
      scale: state.scale,
      choice,
      level: 2,
    });
    // Training only, the same rule the app's own difficulty sheet uses — the landing shows the
    // identical three rows, and a page promising thirteen minutes for what the app then calls
    // eight is the product disagreeing with its own advertisement.
    const duration = estimateTrainingDuration(p);
    const points = estimatePoints(workout, choice);
    const n = formatNumber(locale, points);
    return {
      choice,
      label: choiceLabel(locale, choice),
      // Whole minutes: the row shows the figure alone, with the unit under it.
      durationMin: Math.max(1, Math.round(duration.totalSec / 60)),
      points,
      pointsLabel: plural(locale, points, {
        one: t(locale, 'landing.adaptPointsOne', { n }),
        few: t(locale, 'landing.adaptPointsFew', { n }),
        many: t(locale, 'landing.adaptPointsMany', { n }),
      }),
      blocks: toDemoBlocks(locale, p.blocks),
    };
  });

  const rec = recommendDifficulty(state, DEMO_PROFILE, nowIso);

  // The scenarios all start from the «as usual» version, so its points are computed once.
  const normal = choices.find((x) => x.choice === 'normal') ?? choices[0]!;

  const scenarios: DemoScenario[] = SCENARIOS.map((s) => {
    const summary: SessionSummary = {
      courseId: c.id,
      nodeId: c.nodes[0]?.id ?? '',
      workoutId: workout.id,
      choice: 'normal',
      scale: state.scale,
      completion: s.completion,
      rpe: s.rpe,
      feeling: s.feeling,
      points: normal.points,
      durationSec: 0,
      calories: 0,
      completedAt: nowIso,
    };
    const adj = adaptScale(state, summary);
    return {
      id: s.id,
      label: scenarioLabel(locale, s.id),
      deltaPercent: Math.round(adj.delta * 100),
      scale: Math.round(adj.scale * 100) / 100,
      reason: l(adj.reason, locale),
      safetyNote: adj.safetyNote ? l(adj.safetyNote, locale) : '',
    };
  });

  return {
    workoutLabel: t(locale, 'landing.adaptWorkoutLabel', {
      course: l(c.name, locale),
      workout: l(workout.name, locale),
    }),
    choices,
    recommended: rec.choice,
    recommendedReason: l(rec.reason, locale),
    scenarios,
    labels: {
      minutes: t(locale, 'common.minutesUnit'),
      recommended: t(locale, 'landing.adaptRecommended'),
      planTitle: t(locale, 'landing.adaptPlanTitle'),
      rpeTitle: t(locale, 'landing.adaptRpeTitle'),
      rpeIntro: t(locale, 'landing.adaptRpeIntro'),
      nextTime: t(locale, 'landing.adaptNextTime'),
      scaleNow: t(locale, 'landing.adaptScaleNow'),
    },
  };
}

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
