/**
 * Guardrails on how hard the published programs actually are.
 *
 * These exist because a real coach read the first version and said a client would not come back
 * after a session like that. The numbers below are the shape of that feedback: a session is a
 * warm-up, one or two main pieces and a cool-down — not a strength block, a metcon and a core
 * finisher stacked on top of each other until the clock reads 48 minutes.
 *
 * They also pin the Easier / As usual / Harder choice to a difference the athlete can feel.
 * An earlier design moved volume and rest in opposite directions, which cancelled out: the three
 * options finished within ~1.4 minutes of each other, and in five workouts "easier" ran longer
 * than "harder".
 */
import { describe, expect, it } from 'vitest';
import { COURSES } from '@content/courses';
import { choiceSetBlockIds, prescribeWorkout } from '@/lib/training/prescribe';
import { MIN_ROUNDS_EASIER_CIRCUIT } from '@/lib/training/constants';
import type { DifficultyChoice, UserTrainingProfile } from '@/lib/training/types';
import type { Workout } from '@/content/schema';

/** Fully equipped, unrestricted athlete: the longest a session can legitimately run. */
const PROFILE = {
  equipment: ['none', 'mat', 'dumbbells', 'kettlebell', 'pullup_bar', 'box', 'jump_rope', 'band'],
  dumbbellKg: [8, 12, 16],
  kettlebellKg: [16, 24],
  limitations: [],
} as unknown as UserTrainingProfile;

const MAX_SESSION_MIN = 40;
/** Beginners get a shorter ceiling: the first course has to be finishable, not impressive. */
const MAX_BEGINNER_SESSION_MIN = 30;
/** A step the athlete can feel, per the coach's brief. */
const MIN_STEP_MIN = 3;
const MAX_STEP_MIN = 14;

function minutes(workout: Workout, choice: DifficultyChoice, scale = 1): number {
  return prescribeWorkout(workout, { profile: PROFILE, level: 2, choice, scale }).estimatedSec / 60;
}

/**
 * The coach's "start every N minutes" pieces, authored as circuits so their rests play (beginner
 * workouts 3 and 10). Their round is a couple of minutes by construction — workout 3 is a single
 * pass of three pairs, which «Полегче» cannot shorten by a round, and workout 10's round is his
 * two-minute window — so «Полегче» removes less than MIN_STEP_MIN. Stretching the rest to reach
 * three minutes would rewrite his format; the harder side keeps the full check.
 */
const EVERY_N_MINUTES = new Set(['w_s03_pairs', 'w_s10_every_2min']);

/** Blocks the choice can add a set to; without one, only volume and windows move. */
function hasScalableSetBlock(workout: Workout): boolean {
  return workout.blocks.some(
    (b) => b.scalable !== false && (b.format === 'sets' || b.format === 'circuit'),
  );
}

/**
 * «Полегче» has no round to take away: every block the choice moves is a main circuit already at
 * the two-round floor (MIN_ROUNDS_EASIER_CIRCUIT — «два круга» is not cut to one), so easier moves
 * on reps alone and is not expected to save minutes.
 */
function easierAtRoundFloor(workout: Workout): boolean {
  const ids = choiceSetBlockIds(workout);
  const moved = workout.blocks.filter((b) => ids.has(b.id));
  return (
    moved.length > 0 &&
    moved.every(
      (b) =>
        b.format === 'circuit' &&
        b.type !== 'core' &&
        b.type !== 'skill' &&
        (b.sets ?? 1) <= MIN_ROUNDS_EASIER_CIRCUIT,
    )
  );
}

const everyWorkout = COURSES.flatMap((c) =>
  (c.workouts as Workout[]).map((w) => ({ courseId: c.id, workout: w })),
);

describe('published course load', () => {
  it.each(everyWorkout)('$courseId/$workout.id fits in one sitting', ({ courseId, workout }) => {
    const cap = courseId === 'start' ? MAX_BEGINNER_SESSION_MIN : MAX_SESSION_MIN;
    expect(minutes(workout, 'normal')).toBeLessThanOrEqual(cap);
  });

  it.each(everyWorkout)(
    '$courseId/$workout.id gets longer with difficulty, never shorter',
    ({ workout }) => {
      const easier = minutes(workout, 'easier');
      const normal = minutes(workout, 'normal');
      const harder = minutes(workout, 'harder');
      expect(easier).toBeLessThanOrEqual(normal);
      expect(normal).toBeLessThanOrEqual(harder);
    },
  );

  it.each(everyWorkout.filter((w) => hasScalableSetBlock(w.workout)))(
    '$courseId/$workout.id moves by a felt amount between choices',
    ({ workout }) => {
      const easier = minutes(workout, 'easier');
      const normal = minutes(workout, 'normal');
      const harder = minutes(workout, 'harder');
      const steps =
        EVERY_N_MINUTES.has(workout.id) || easierAtRoundFloor(workout)
          ? [harder - normal]
          : [normal - easier, harder - normal];
      for (const step of steps) {
        expect(step).toBeGreaterThanOrEqual(MIN_STEP_MIN);
        expect(step).toBeLessThanOrEqual(MAX_STEP_MIN);
      }
      // Easier still has to be easier, even where it cannot be three minutes easier.
      expect(normal - easier).toBeGreaterThan(0);
    },
  );

  it('a core circuit is never prescribed as a lung-burner', () => {
    // 30 s between rounds of core work, straight after a strength block, is what made the first
    // version unrepeatable. Core is accessory work; it gets real rest.
    for (const course of COURSES) {
      for (const workout of course.workouts as Workout[]) {
        for (const block of workout.blocks) {
          if (block.type !== 'core') continue;
          const rest = block.restBetweenRoundsSec ?? block.restBetweenSetsSec ?? 0;
          if ((block.sets ?? 1) > 1) expect(rest).toBeGreaterThanOrEqual(45);
        }
      }
    }
  });

  it('tests and benchmarks are identical at every difficulty', () => {
    // A benchmark you can scale is not a benchmark: the whole point is comparing it to last time.
    for (const course of COURSES) {
      for (const workout of course.workouts as Workout[]) {
        if (!workout.blocks.every((b) => b.scalable === false)) continue;
        expect(minutes(workout, 'easier')).toBe(minutes(workout, 'normal'));
        expect(minutes(workout, 'harder')).toBe(minutes(workout, 'normal'));
      }
    }
  });
});
