/**
 * Builds the props of the <DifficultyDemo> island at build time with the real training engine and
 * the real `start` course: three prescriptions (easier / normal / harder) and four post-workout
 * scenarios showing how the next load adapts. Returns null while the course content is missing so
 * the home page still builds.
 */
import { COURSE_BY_ID, EXERCISE_BY_ID } from '@/content/registry';
import type { Course, Locale } from '@/content/schema';
import { formatDuration, l, t } from '@/i18n/index';
import {
  adaptScale,
  estimateDuration,
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
import { sampleWorkout } from './courseHelpers';

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

function blockMeta(locale: Locale, b: PrescribedBlock): string {
  const format = t(locale, `training.format_${b.format}`);
  switch (b.format) {
    case 'sets':
      return `${format} · ${t(locale, 'landing.blockSets', { n: b.sets })}`;
    case 'circuit':
      return `${format} · ${t(locale, 'landing.blockRounds', { n: b.sets })}`;
    case 'amrap':
    case 'fortime':
      return `${format} · ${t(locale, 'landing.blockMinutes', {
        n: Math.round((b.durationSec ?? b.estimatedSec) / 60),
      })}`;
    case 'emom':
      return `${format} · ${t(locale, 'landing.blockMinutes', { n: b.sets })}`;
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
    const duration = estimateDuration(p);
    return {
      choice,
      label: choiceLabel(locale, choice),
      duration: formatDuration(locale, duration.totalSec),
      points: estimatePoints(workout, choice),
      blocks: toDemoBlocks(locale, p.blocks),
    };
  });

  const rec = recommendDifficulty(state, DEMO_PROFILE, nowIso);

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
      duration: t(locale, 'landing.adaptDuration'),
      points: t(locale, 'landing.adaptPoints'),
      pointsShort: t(locale, 'common.pointsShort'),
      recommended: t(locale, 'landing.adaptRecommended'),
      planTitle: t(locale, 'landing.adaptPlanTitle'),
      rpeTitle: t(locale, 'landing.adaptRpeTitle'),
      rpeIntro: t(locale, 'landing.adaptRpeIntro'),
      nextTime: t(locale, 'landing.adaptNextTime'),
      scaleNow: t(locale, 'landing.adaptScaleNow'),
    },
  };
}
