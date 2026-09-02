/**
 * Self-contained exercise / workout / profile fixtures for the engine tests.
 * They are typed with the content schema but never touch the real content library, so the
 * engine tests stay green while the exercise library is being written.
 */
import type { Block, Exercise, Workout, WorkoutItem } from '@/content/schema';
import type { CourseState, ExerciseLookup, SessionSummary, UserTrainingProfile } from './types';

const l = (en: string, ru = en) => ({ ru, en });

type ExerciseOverrides = Partial<Exercise> & Pick<Exercise, 'id'>;

export function makeExercise(o: ExerciseOverrides): Exercise {
  const name = o.name ?? l(o.id.replace(/_/g, ' '));
  const unit = o.unit ?? 'reps';
  return {
    id: o.id,
    slug: o.slug ?? { ru: o.id.replace(/_/g, '-'), en: o.id.replace(/_/g, '-') },
    name,
    description: o.description ?? l(`${name.en}. Fixture exercise for engine tests.`),
    howTo: o.howTo ?? [l('Set up.'), l('Move.'), l('Return.')],
    cues: o.cues ?? [l('Brace.'), l('Breathe.')],
    mistakes: o.mistakes ?? [l('Rushing.')],
    muscles: o.muscles ?? ['full_body'],
    pattern: o.pattern ?? 'full_body',
    equipment: o.equipment ?? ['none'],
    level: o.level ?? 1,
    unit,
    ...(unit === 'reps' ? { secondsPerRep: o.secondsPerRep ?? 2 } : {}),
    ...(o.secondsPerRep !== undefined && unit !== 'reps' ? { secondsPerRep: o.secondsPerRep } : {}),
    met: o.met ?? 6,
    loadable: o.loadable ?? false,
    scaling: o.scaling ?? {},
    animation: o.animation ?? o.id,
    tags: o.tags ?? [],
    ...(o.isTest !== undefined ? { isTest: o.isTest } : {}),
    ...(o.video !== undefined ? { video: o.video } : {}),
    ...(o.shortName !== undefined ? { shortName: o.shortName } : {}),
    ...(o.breathing !== undefined ? { breathing: o.breathing } : {}),
  };
}

export const FIXTURE_EXERCISES: readonly Exercise[] = [
  // Push family (push_up → knee_push_up → incline_push_up; decline is harder)
  makeExercise({
    id: 'push_up',
    pattern: 'push_horizontal',
    muscles: ['chest', 'triceps'],
    level: 2,
    secondsPerRep: 2,
    met: 8,
    scaling: { easier: 'knee_push_up', harder: 'decline_push_up' },
  }),
  makeExercise({
    id: 'knee_push_up',
    pattern: 'push_horizontal',
    muscles: ['chest'],
    level: 1,
    secondsPerRep: 2,
    met: 6,
    scaling: { easier: 'incline_push_up', harder: 'push_up' },
  }),
  makeExercise({
    id: 'incline_push_up',
    pattern: 'push_horizontal',
    muscles: ['chest'],
    level: 1,
    equipment: ['chair', 'box'],
    secondsPerRep: 2,
    met: 5,
    scaling: { harder: 'knee_push_up' },
  }),
  makeExercise({
    id: 'decline_push_up',
    pattern: 'push_horizontal',
    muscles: ['chest'],
    level: 3,
    equipment: ['chair', 'box'],
    secondsPerRep: 2.5,
    met: 8,
    scaling: { easier: 'push_up' },
  }),
  // Squat family
  makeExercise({
    id: 'air_squat',
    pattern: 'squat',
    muscles: ['quads', 'glutes'],
    level: 1,
    secondsPerRep: 2.5,
    met: 5.5,
    scaling: { harder: 'jump_squat' },
  }),
  makeExercise({
    id: 'jump_squat',
    pattern: 'jump',
    muscles: ['quads', 'glutes'],
    level: 2,
    secondsPerRep: 2,
    met: 9,
    scaling: { easier: 'air_squat', harder: 'tuck_jump' },
  }),
  makeExercise({
    id: 'tuck_jump',
    pattern: 'jump',
    muscles: ['quads', 'cardio'],
    level: 3,
    secondsPerRep: 2,
    met: 10,
    scaling: { easier: 'jump_squat' },
  }),
  makeExercise({
    id: 'db_goblet_squat',
    pattern: 'squat',
    muscles: ['quads', 'glutes'],
    level: 2,
    equipment: ['dumbbells', 'kettlebell'],
    loadable: true,
    secondsPerRep: 3,
    met: 6,
    scaling: { easier: 'air_squat' },
  }),
  // Hinge family (kettlebell)
  makeExercise({
    id: 'kb_swing',
    pattern: 'hinge',
    muscles: ['glutes', 'hamstrings'],
    level: 2,
    equipment: ['kettlebell'],
    loadable: true,
    secondsPerRep: 1.5,
    met: 9.8,
    scaling: { easier: 'kb_deadlift' },
  }),
  makeExercise({
    id: 'kb_deadlift',
    pattern: 'hinge',
    muscles: ['glutes', 'hamstrings'],
    level: 1,
    equipment: ['kettlebell', 'dumbbells'],
    loadable: true,
    secondsPerRep: 3,
    met: 6,
    scaling: { easier: 'glute_bridge', harder: 'kb_swing' },
  }),
  makeExercise({
    id: 'glute_bridge',
    pattern: 'hinge',
    muscles: ['glutes'],
    level: 1,
    secondsPerRep: 2.5,
    met: 3.5,
    scaling: { harder: 'kb_deadlift' },
  }),
  // Overhead (dumbbell)
  makeExercise({
    id: 'db_press',
    pattern: 'push_vertical',
    muscles: ['shoulders', 'triceps'],
    level: 2,
    equipment: ['dumbbells'],
    loadable: true,
    secondsPerRep: 2.5,
    met: 5,
    scaling: { easier: 'db_front_raise' },
  }),
  makeExercise({
    id: 'db_front_raise',
    pattern: 'push_vertical',
    muscles: ['shoulders'],
    level: 1,
    equipment: ['dumbbells'],
    loadable: true,
    secondsPerRep: 2.5,
    met: 4,
    scaling: { harder: 'db_press' },
  }),
  // Pull family (bar → chair row → band row)
  makeExercise({
    id: 'pull_up',
    pattern: 'pull_vertical',
    muscles: ['lats', 'biceps'],
    level: 3,
    equipment: ['pullup_bar'],
    secondsPerRep: 3,
    met: 8,
    scaling: { easier: 'inverted_row' },
  }),
  makeExercise({
    id: 'inverted_row',
    pattern: 'pull_horizontal',
    muscles: ['back', 'biceps'],
    level: 2,
    equipment: ['chair'],
    secondsPerRep: 2.5,
    met: 6,
    scaling: { easier: 'band_row', harder: 'pull_up' },
  }),
  makeExercise({
    id: 'band_row',
    pattern: 'pull_horizontal',
    muscles: ['back'],
    level: 1,
    equipment: ['bands'],
    secondsPerRep: 2,
    met: 4,
    scaling: { harder: 'inverted_row' },
  }),
  // Core
  makeExercise({
    id: 'plank',
    pattern: 'core_anti_extension',
    muscles: ['core'],
    level: 1,
    unit: 'seconds',
    met: 3.8,
    scaling: { easier: 'knee_plank', harder: 'plank_shoulder_tap' },
    tags: ['isometric'],
  }),
  makeExercise({
    id: 'knee_plank',
    pattern: 'core_anti_extension',
    muscles: ['core'],
    level: 1,
    unit: 'seconds',
    met: 3,
    scaling: { harder: 'plank' },
    tags: ['isometric'],
  }),
  makeExercise({
    id: 'plank_shoulder_tap',
    pattern: 'core_anti_extension',
    muscles: ['core', 'shoulders'],
    level: 2,
    secondsPerRep: 1.5,
    met: 5,
    scaling: { easier: 'plank' },
  }),
  makeExercise({
    id: 'sit_up',
    pattern: 'core_flexion',
    muscles: ['core'],
    level: 1,
    secondsPerRep: 2,
    met: 5,
    scaling: { easier: 'dead_bug' },
  }),
  makeExercise({
    id: 'dead_bug',
    pattern: 'core_anti_extension',
    muscles: ['core'],
    level: 1,
    secondsPerRep: 3,
    met: 3,
    scaling: { harder: 'sit_up' },
  }),
  makeExercise({
    id: 'superman',
    pattern: 'core_anti_extension',
    muscles: ['back', 'glutes'],
    level: 1,
    unit: 'seconds',
    met: 3,
    scaling: { easier: 'glute_bridge' },
  }),
  makeExercise({
    id: 'russian_twist',
    pattern: 'core_rotation',
    muscles: ['obliques'],
    level: 1,
    secondsPerRep: 1.5,
    met: 5,
    scaling: { easier: 'dead_bug' },
  }),
  // Conditioning
  makeExercise({
    id: 'burpee',
    pattern: 'full_body',
    muscles: ['full_body', 'cardio'],
    level: 2,
    secondsPerRep: 4,
    met: 10,
    scaling: { easier: 'step_back_burpee' },
  }),
  makeExercise({
    id: 'step_back_burpee',
    pattern: 'full_body',
    muscles: ['full_body'],
    level: 1,
    secondsPerRep: 4.5,
    met: 8,
    scaling: { easier: 'air_squat', harder: 'burpee' },
  }),
  makeExercise({
    id: 'jumping_lunge',
    pattern: 'jump',
    muscles: ['quads', 'glutes'],
    level: 3,
    secondsPerRep: 1.5,
    met: 9,
    scaling: { easier: 'reverse_lunge' },
  }),
  makeExercise({
    id: 'reverse_lunge',
    pattern: 'lunge',
    muscles: ['quads', 'glutes'],
    level: 1,
    secondsPerRep: 3,
    met: 5,
    scaling: { harder: 'jumping_lunge' },
  }),
  makeExercise({
    id: 'bear_crawl',
    pattern: 'locomotion',
    muscles: ['full_body'],
    level: 2,
    unit: 'meters',
    met: 7,
    scaling: { easier: 'dead_bug' },
  }),
  makeExercise({
    id: 'run',
    pattern: 'locomotion',
    muscles: ['cardio'],
    level: 1,
    unit: 'meters',
    met: 8,
    scaling: {},
  }),
  makeExercise({
    id: 'jump_rope',
    pattern: 'jump',
    muscles: ['calves', 'cardio'],
    level: 1,
    equipment: ['jump_rope'],
    unit: 'seconds',
    met: 11,
    scaling: { easier: 'run_in_place' },
  }),
  makeExercise({
    id: 'run_in_place',
    pattern: 'locomotion',
    muscles: ['cardio'],
    level: 1,
    unit: 'seconds',
    met: 7,
    scaling: {},
  }),
  makeExercise({
    id: 'bike_cal',
    pattern: 'locomotion',
    muscles: ['cardio'],
    level: 1,
    equipment: ['none'],
    unit: 'calories',
    met: 7,
    scaling: {},
  }),
];

export const FIXTURE_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  FIXTURE_EXERCISES.map((e) => [e.id, e]),
);

export const fixtureLookup: ExerciseLookup = (id) => FIXTURE_BY_ID.get(id);

export function fx(id: string): Exercise {
  const e = FIXTURE_BY_ID.get(id);
  if (!e) throw new Error(`fixture exercise missing: ${id}`);
  return e;
}

/* ---------------------------------------------------------------------------------------------
 * Workouts
 * ------------------------------------------------------------------------------------------- */

export function item(exerciseId: string, o: Partial<WorkoutItem> = {}): WorkoutItem {
  const hasUnit =
    o.reps !== undefined ||
    o.seconds !== undefined ||
    o.meters !== undefined ||
    o.calories !== undefined;
  return { exerciseId, ...(hasUnit ? {} : { reps: 10 }), ...o };
}

export function block(o: Partial<Block> & Pick<Block, 'id' | 'format' | 'items'>): Block {
  return { type: 'strength', scalable: true, ...o };
}

export function workout(o: Partial<Workout> & Pick<Workout, 'id' | 'blocks'>): Workout {
  return {
    name: l(o.id),
    focus: l('Fixture'),
    description: l('Fixture workout used by the engine tests.'),
    basePoints: 100,
    tags: [],
    ...o,
  };
}

/** A representative full-body session: warm-up, strength sets, AMRAP, tabata, cool-down. */
export const FULL_WORKOUT: Workout = workout({
  id: 'fixture_full',
  basePoints: 120,
  blocks: [
    block({
      id: 'warmup',
      type: 'warmup',
      format: 'circuit',
      sets: 1,
      scalable: false,
      title: l('Warm-up', 'Разминка'),
      items: [item('air_squat', { reps: 10 }), item('plank', { seconds: 20 })],
    }),
    block({
      id: 'strength',
      type: 'strength',
      format: 'sets',
      sets: 3,
      restBetweenSetsSec: 60,
      items: [
        item('push_up', { reps: 10, restAfterSec: 30 }),
        item('db_goblet_squat', { reps: 12, load: 'medium' }),
      ],
    }),
    block({
      id: 'metcon',
      type: 'metcon',
      format: 'amrap',
      durationSec: 600,
      items: [
        item('burpee', { reps: 5 }),
        item('air_squat', { reps: 10 }),
        item('kb_swing', { reps: 15, load: 'light' }),
      ],
    }),
    block({
      id: 'core',
      type: 'core',
      format: 'tabata',
      rounds: 8,
      workSec: 20,
      restSec: 10,
      items: [item('plank', { seconds: 20 })],
    }),
    block({
      id: 'cooldown',
      type: 'cooldown',
      format: 'sets',
      sets: 1,
      scalable: false,
      items: [item('glute_bridge', { reps: 10 })],
    }),
  ],
});

/* ---------------------------------------------------------------------------------------------
 * Profiles and state
 * ------------------------------------------------------------------------------------------- */

export function profile(o: Partial<UserTrainingProfile> = {}): UserTrainingProfile {
  return {
    ageBand: '25-34',
    sex: 'male',
    weightKg: 75,
    activityLevel: 'moderate',
    experience: 'beginner',
    tests: { pushups: 20, squats60s: 35, plankSec: 60 },
    limitations: [],
    equipment: ['none', 'mat', 'dumbbells', 'kettlebell', 'chair'],
    dumbbellKg: [6, 10, 14],
    kettlebellKg: [12, 16],
    timePerSessionMin: 30,
    goal: 'general',
    ...o,
  };
}

export function summary(o: Partial<SessionSummary> = {}): SessionSummary {
  return {
    courseId: 'c1',
    nodeId: 'n1',
    workoutId: 'fixture_full',
    choice: 'normal',
    scale: 1,
    completion: 1,
    rpe: 6,
    feeling: 'ok',
    points: 120,
    durationSec: 1500,
    calories: 220,
    completedAt: '2026-09-01T10:00:00.000Z',
    ...o,
  };
}

export function courseState(o: Partial<CourseState> = {}): CourseState {
  return { scale: 1, history: [], completedNodeIds: [], ...o };
}
