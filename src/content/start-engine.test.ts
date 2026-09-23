/**
 * «Форма с нуля» through the real engine: every workout × the profiles that actually buy it × the
 * three difficulty choices, asserting what the September audit found broken.
 *
 * The audit was a script run by hand; this is that script made permanent. Each assertion names the
 * defect it guards: a window the screen shows as «7 мин» that runs six and a half, an EMOM that
 * gives four minutes to three movements, «полегче» identical to «как обычно», a substitute without
 * the coach's clip, a benchmark that moves with the choice.
 */
import { describe, expect, it } from 'vitest';
import { findCourse, findExercise, findWorkout } from '@/content/catalogue';
import type { Course, Workout } from '@/content/schema';
import { computeFitnessIndex, initialScale } from '@/lib/training/assessment';
import { SUBSTITUTE_REPS_FACTOR } from '@/lib/training/constants';
import { estimateTrainingDuration, isTrainingBlock } from '@/lib/training/estimate';
import { buildPlayerSteps } from '@/lib/training/player';
import { holdsRounds, prescribeWorkout } from '@/lib/training/prescribe';
import type {
  DifficultyChoice,
  PlayerStep,
  PrescribedItem,
  PrescribedWorkout,
  UserTrainingProfile,
} from '@/lib/training/types';
import { nodeAccess } from '@/app/features/courses/courseAccess';
import { nodeStatus } from '@/app/features/path/nodeState';

const course = findCourse('start') as Course;
const workouts: Workout[] = course.nodes
  .filter((n) => n.workoutId)
  .map((n) => findWorkout(course, n.workoutId!)!)
  .filter(Boolean);

/* ---------------------------------------------------------------------------------------------
 * Profiles
 * ------------------------------------------------------------------------------------------- */

const BEGINNER = {
  ageBand: '25-34',
  sex: 'female',
  activityLevel: 'sedentary',
  experience: 'none',
  tests: { pushups: 3, pushupsOnKnees: true, squats60s: 20, plankSec: 20 },
  limitations: [],
  equipment: [],
} as unknown as UserTrainingProfile;

const assessed = computeFitnessIndex(BEGINNER);

interface Case {
  name: string;
  profile: UserTrainingProfile;
  level: 1 | 2 | 3;
  scale: number;
}

const PROFILES: Case[] = [
  {
    name: 'beginner',
    profile: BEGINNER,
    level: assessed.level,
    scale: initialScale(assessed.index),
  },
  {
    name: 'wrists',
    profile: { ...BEGINNER, limitations: ['wrists'] },
    level: assessed.level,
    scale: initialScale(assessed.index),
  },
  {
    name: 'knees',
    profile: { ...BEGINNER, limitations: ['knees'] },
    level: assessed.level,
    scale: initialScale(assessed.index),
  },
  {
    name: 'level3',
    profile: {
      ...BEGINNER,
      activityLevel: 'active',
      experience: 'advanced',
      tests: { pushups: 40, squats60s: 50, plankSec: 120 },
      equipment: ['dumbbells', 'kettlebell', 'pullup_bar', 'jump_rope', 'box', 'bench'],
      dumbbellKg: [8, 12],
      kettlebellKg: [16],
    } as unknown as UserTrainingProfile,
    level: 3,
    scale: 1.2,
  },
];

const CHOICES: DifficultyChoice[] = ['easier', 'normal', 'harder'];

/**
 * Where a limitation forces a movement the coach never filmed: safety beats video (see
 * `substituteExercise`). `profile:original>substitute`. Anything outside this list that plays
 * without a clip is a regression.
 */
const UNFILMED_FOR_SAFETY = new Set(['wrists:mountain_climber>high_knees']);

const prescribe = (w: Workout, c: Case, choice: DifficultyChoice): PrescribedWorkout =>
  prescribeWorkout(w, { profile: c.profile, level: c.level, scale: c.scale, choice });

const matrix = workouts.flatMap((workout) =>
  PROFILES.map((c) => ({ id: workout.id, workout, profileName: c.name, c })),
);

/** Items the player shows, per step, for the clip check. */
function playedItems(step: PlayerStep): PrescribedItem[] {
  switch (step.kind) {
    case 'work':
      return [step.item];
    case 'amrap':
    case 'fortime':
      return step.items;
    default:
      return [];
  }
}

/**
 * Work in a prescription the athlete would recognise as «how much»: repetitions, with the coach's
 * dead-bug swap counted at its equivalence («в два раза больше» is the same work), and seconds.
 * EMOMs walk their minutes as the player does; AMRAPs count one round plus the window.
 */
function volume(p: PrescribedWorkout): { reps: number; sec: number } {
  let reps = 0;
  let sec = 0;
  const add = (it: PrescribedItem, times: number) => {
    const pair = it.substituted
      ? SUBSTITUTE_REPS_FACTOR[`${it.originalExerciseId}>${it.exerciseId}`]
      : undefined;
    const factor = pair?.factor ?? 1;
    const sides = it.perSide ? 2 : 1;
    if (it.unit === 'reps') reps += ((it.target * sides) / factor) * times;
    else if (it.unit === 'seconds') sec += it.target * sides * times;
  };
  for (const b of p.blocks.filter(isTrainingBlock)) {
    if (b.format === 'emom') {
      for (let m = 0; m < b.sets; m++) add(b.items[m % b.items.length]!, 1);
    } else {
      for (const it of b.items) add(it, b.format === 'amrap' ? 1 : b.sets);
    }
    if (b.format === 'amrap' || b.format === 'fortime') sec += b.durationSec ?? 0;
  }
  return { reps, sec };
}

describe('«Форма с нуля» through the engine', () => {
  it('has the twenty workouts of the coach', () => {
    expect(workouts).toHaveLength(20);
  });

  it.each(matrix)('$id × $profileName: sound numbers at every choice', ({ workout, c }) => {
    for (const choice of CHOICES) {
      const p = prescribe(workout, c, choice);
      for (const b of p.blocks) {
        expect(b.items.length, `${b.blockId} has items`).toBeGreaterThan(0);
        for (const it of b.items) {
          const where = `${choice} ${b.blockId}/${it.exerciseId}`;
          expect(Number.isInteger(it.target) && it.target > 0, `${where} target`).toBe(true);
          if (it.unit === 'seconds') expect(it.target % 5, `${where} seconds ÷5`).toBe(0);
          // The coach's dead-bug swap: twice the reps, and even (one per side).
          if (
            it.substituted &&
            SUBSTITUTE_REPS_FACTOR[`${it.originalExerciseId}>${it.exerciseId}`]?.even
          )
            expect(it.target % 2, `${where} even`).toBe(0);
        }
        if (b.format === 'amrap' || b.format === 'fortime')
          expect(b.durationSec! % 60, `${choice} ${b.blockId} whole-minute window`).toBe(0);
        if (b.format === 'emom') {
          expect(Number.isInteger(b.sets) && b.sets > 0).toBe(true);
          expect(b.sets % b.items.length, `${choice} ${b.blockId} whole cycles`).toBe(0);
        }
      }
    }
  });

  it.each(matrix)('$id × $profileName: substitutes drop the original cue', ({ workout, c }) => {
    for (const choice of CHOICES) {
      const p = prescribe(workout, c, choice);
      p.blocks.forEach((b, bi) => {
        b.items.forEach((it, ii) => {
          if (!it.substituted) return;
          const authored = workout.blocks[bi]!.items[ii]!.note;
          if (authored) expect(it.note?.ru ?? '').not.toContain(authored.ru);
        });
      });
    }
  });

  it.each(matrix)('$id × $profileName: easier ≤ normal ≤ harder', ({ workout, c }) => {
    const [e, n, h] = CHOICES.map((choice) => volume(prescribe(workout, c, choice)));
    expect(e!.reps).toBeLessThanOrEqual(n!.reps);
    expect(n!.reps).toBeLessThanOrEqual(h!.reps);
    expect(e!.sec).toBeLessThanOrEqual(n!.sec);
    expect(n!.sec).toBeLessThanOrEqual(h!.sec);
  });

  it.each(matrix)('$id × $profileName: EMOM «полегче» is below «как обычно»', ({ workout, c }) => {
    const easier = prescribe(workout, c, 'easier');
    const normal = prescribe(workout, c, 'normal');
    easier.blocks.forEach((b, bi) => {
      if (b.format !== 'emom' || !b.scaled) return;
      b.items.forEach((it, ii) => {
        const usual = normal.blocks[bi]!.items[ii]!;
        if (it.unit !== 'reps' || it.exerciseId !== usual.exerciseId) return;
        if (usual.target > (it.target % 2 === 0 && usual.target % 2 === 0 ? 2 : 1))
          expect(it.target, `${b.blockId}/${it.exerciseId}`).toBeLessThan(usual.target);
      });
    });
  });

  it.each(matrix)('$id × $profileName: every movement plays with a clip', ({ workout, c }) => {
    for (const choice of CHOICES) {
      const steps = buildPlayerSteps(prescribe(workout, c, choice));
      expect(steps[steps.length - 1]!.kind).toBe('done');
      expect(steps.filter((s) => s.kind === 'done')).toHaveLength(1);
      for (const step of steps) {
        for (const it of playedItems(step)) {
          if (findExercise(it.exerciseId)?.video) continue;
          const key = `${c.profile.limitations.join('+')}:${it.originalExerciseId}>${it.exerciseId}`;
          expect(UNFILMED_FOR_SAFETY.has(key), `${choice} ${it.exerciseId} has no clip`).toBe(true);
        }
      }
    }
  });

  /*
   * Benchmarks (s19, s20) become `scalable: false` in the content PR; checking every block that is
   * not scalable covers them from that moment and the warm-up / cool-down already.
   */
  it.each(matrix)(
    '$id × $profileName: fixed blocks are identical at every choice',
    ({ workout, c }) => {
      const ps = CHOICES.map((choice) => prescribe(workout, c, choice));
      workout.blocks.forEach((b, bi) => {
        if (b.scalable !== false) return;
        const [e, n, h] = ps.map((p) => JSON.stringify(p.blocks[bi]));
        expect(e, `${b.id} easier`).toBe(n);
        expect(h, `${b.id} harder`).toBe(n);
      });
    },
  );

  /*
   * The owner's screenshot of workout 3: 8 / 8 / 17 minutes on the three rows. s03 is one pass of
   * three pairs; «Посложнее» added a second pass and doubled the session.
   */
  it.each(matrix)('$id × $profileName: no choice changes a 1-round circuit', ({ workout, c }) => {
    for (const choice of CHOICES) {
      const p = prescribe(workout, c, choice);
      workout.blocks.forEach((b, bi) => {
        if (b.format !== 'circuit' || (b.sets ?? 1) !== 1) return;
        expect(p.blocks[bi]!.sets, `${choice} ${b.id}`).toBe(1);
      });
    }
  });

  /*
   * The same screenshot's other half: «Полегче» and «Как обычно» both read 8 minutes. A circuit
   * whose rounds the choice holds (`holdsRounds`) has only its reps to give, so they give at least
   * a tenth.
   */
  it.each(matrix)('$id × $profileName: a held circuit is visibly lighter', ({ workout, c }) => {
    const [e, n] = (['easier', 'normal'] as const).map((ch) => prescribe(workout, c, ch));
    workout.blocks.forEach((b, bi) => {
      if (b.scalable === false || !holdsRounds(b)) return;
      const reps = (p: PrescribedWorkout) =>
        p.blocks[bi]!.items.reduce((sum, it) => sum + (it.unit === 'reps' ? it.target : 0), 0);
      expect(e!.blocks[bi]!.sets, b.id).toBe(n!.blocks[bi]!.sets);
      expect(reps(e!), b.id).toBeLessThanOrEqual(reps(n!) * 0.9);
    });
  });

  /*
   * The minutes the difficulty sheet shows (training only). «Посложнее» is a step, not another
   * session: at most a little over a third more — unless all it does is give back rounds the
   * athlete's scale took away, which is the coach's own session and never more than it.
   */
  it.each(matrix)('$id × $profileName: harder ≤ 1.35 × normal minutes', ({ workout, c }) => {
    const normal = prescribe(workout, c, 'normal');
    const harder = prescribe(workout, c, 'harder');
    const beyondAuthored = harder.blocks.some((b, bi) => {
      const authored = workout.blocks[bi]!;
      return (
        (authored.format === 'sets' || authored.format === 'circuit') &&
        b.sets > (authored.sets ?? 1)
      );
    });
    if (!beyondAuthored) return;
    const min = (p: PrescribedWorkout) => estimateTrainingDuration(p).totalSec / 60;
    expect(min(harder), workout.id).toBeLessThanOrEqual(min(normal) * 1.35);
  });

  it('training minutes stay in a beginner session', () => {
    const c = PROFILES[0]!;
    for (const w of workouts) {
      for (const choice of CHOICES) {
        const min = estimateTrainingDuration(prescribe(w, c, choice)).totalSec / 60;
        expect(min, `${w.id} ${choice}`).toBeGreaterThan(1);
        expect(min, `${w.id} ${choice}`).toBeLessThan(30);
      }
    }
  });

  it('opens the first workout free and the rest after payment, in order', () => {
    const nodes = course.nodes;
    const first = nodes.findIndex((n) => n.kind !== 'rest' && n.kind !== 'milestone');
    expect(first).toBe(0);
    nodes.forEach((node, i) => {
      expect(nodeAccess({ owned: false, course, node })).toBe(i === first ? 'open' : 'paywalled');
      expect(nodeAccess({ owned: true, course, node })).toBe('open');
    });
    const fresh = { currentNodeIndex: 0, completedNodeIds: [] as string[] };
    expect(nodeStatus(0, nodes, fresh)).toBe('current');
    for (let i = 1; i < nodes.length; i++) expect(nodeStatus(i, nodes, fresh)).toBe('locked');
    const afterFirst = { currentNodeIndex: 1, completedNodeIds: [nodes[0]!.id] };
    expect(nodeStatus(0, nodes, afterFirst)).toBe('done');
    expect(nodeStatus(1, nodes, afterFirst)).toBe('current');
    expect(nodeStatus(2, nodes, afterFirst)).toBe('locked');
  });
});
