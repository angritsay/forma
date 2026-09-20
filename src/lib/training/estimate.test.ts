import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHT_KG, REST_MET } from './constants';
import {
  estimateCalories,
  estimateDuration,
  estimatePoints,
  estimateTrainingDuration,
  workoutVolume,
} from './estimate';
import {
  block,
  fixtureLookup,
  FULL_WORKOUT,
  item,
  profile,
  workout,
} from './fixtures.test-helpers';
import { allCourses } from '@/content/catalogue';
import { buildPlayerSteps } from './player';
import { prescribeWorkout } from './prescribe';
import type { PrescribeOptions } from './types';

const opts: PrescribeOptions = { profile: profile(), scale: 1, choice: 'normal', level: 2 };
const prescribe = (w = FULL_WORKOUT) => prescribeWorkout(w, opts, fixtureLookup);
const one = (b: Parameters<typeof block>[0]) => prescribe(workout({ id: 'w', blocks: [block(b)] }));

describe('estimateDuration', () => {
  it('sets: sets × (work + restAfter + transitions) + (sets − 1) × rest + intro', () => {
    // push_up 10 × 2 s = 20 (+30 rest), goblet 12 × 3 s = 36; 3 sets, 60 s between
    const d = estimateDuration(prescribe()).perBlock[1]!;
    expect(d.sec).toBe(3 * (56 + 30 + 16) + 2 * 60 + 20);
  });

  it('reports the work / rest split and per-block breakdown matching the prescription', () => {
    const p = prescribe();
    const d = estimateDuration(p);
    expect(d.perBlock.map((b) => b.blockId)).toEqual([
      'warmup',
      'strength',
      'metcon',
      'core',
      'cooldown',
    ]);
    expect(d.perBlock.map((b) => b.sec)).toEqual(p.blocks.map((b) => b.estimatedSec));
    expect(d.totalSec).toBe(p.estimatedSec);
    expect(d.workSec + d.restSec).toBeLessThanOrEqual(d.totalSec);
    expect(d.workSec).toBeGreaterThan(0);
    expect(d.restSec).toBeGreaterThan(0);
  });

  it('amrap and emom are format-fixed with a 70/30 split', () => {
    const a = estimateDuration(
      one({ id: 'a', format: 'amrap', durationSec: 600, items: [item('burpee')] }),
    );
    expect(a.totalSec).toBe(620);
    expect(a.workSec).toBe(420);
    expect(a.restSec).toBe(180);
    /*
     * `rounds` on an EMOM is minutes, not cycles: ten minutes, the two movements alternating
     * through them. This is the player's own rule (`buildPlayerSteps` indexes `items[(m - 1) % n]`)
     * and the estimate has to be the same clock.
     */
    const e = estimateDuration(
      one({ id: 'e', format: 'emom', rounds: 10, items: [item('burpee'), item('air_squat')] }),
    );
    expect(e.totalSec).toBe(620);
    expect(e.workSec).toBe(420);
  });

  it('tabata and interval: rounds × work × items plus the rests the player actually plays', () => {
    const t = estimateDuration(
      one({
        id: 't',
        format: 'tabata',
        rounds: 8,
        workSec: 20,
        restSec: 10,
        items: [item('plank', { seconds: 20 })],
      }),
    );
    // 8 × 20 s work, 7 rests of 10 s (no trailing rest), 20 s intro
    expect(t.totalSec).toBe(250);
    expect(t.workSec).toBe(160);
    expect(t.restSec).toBe(70);
    const t2 = estimateDuration(
      one({
        id: 't',
        format: 'tabata',
        rounds: 8,
        workSec: 20,
        restSec: 10,
        items: [item('plank', { seconds: 20 }), item('air_squat', { reps: 10 })],
      }),
    );
    // two Tabatas: 2 × 8 × 20 s work, 2 × 7 rests + one 10 s gap between them
    expect(t2.totalSec).toBe(490);
    const i = estimateDuration(
      one({
        id: 'i',
        format: 'interval',
        rounds: 4,
        workSec: 40,
        restSec: 20,
        items: [item('run', { meters: 100 }), item('burpee', { reps: 5 })],
      }),
    );
    // 8 work intervals of 40 s, 7 rests of 20 s
    expect(i.totalSec).toBe(480);
  });

  it('uses the format defaults when a tabata block omits work and rest seconds', () => {
    const d = estimateDuration(
      one({ id: 't', format: 'tabata', rounds: 8, items: [item('air_squat', { reps: 10 })] }),
    );
    expect(d.workSec).toBe(160);
    expect(d.restSec).toBe(70);
  });

  it('never counts a rest the player skips (trailing rests, last set, last round)', () => {
    const w = workout({
      id: 'w',
      blocks: [
        block({
          id: 's',
          format: 'sets',
          sets: 3,
          restBetweenSetsSec: 60,
          items: [
            item('push_up', { reps: 10, restAfterSec: 30 }),
            item('air_squat', { reps: 15, restAfterSec: 45 }),
          ],
        }),
        block({
          id: 't',
          format: 'tabata',
          rounds: 8,
          workSec: 20,
          restSec: 10,
          restBetweenRoundsSec: 60,
          items: [item('air_squat', { reps: 10 }), item('burpee', { reps: 5 })],
        }),
        block({
          id: 'i',
          format: 'interval',
          rounds: 4,
          workSec: 40,
          restSec: 20,
          items: [item('run', { meters: 100 }), item('burpee', { reps: 5 })],
        }),
      ],
    });
    const p = prescribe(w);
    const played = buildPlayerSteps(p)
      .filter((s) => s.kind === 'rest')
      .reduce((total, s) => total + (s.kind === 'rest' ? s.durationSec : 0), 0);
    // 3 × 30 + 2 × 60 | 2 × 7 × 10 + 60 gap | 7 × 20
    expect(played).toBe(210 + 200 + 140);
    expect(estimateDuration(p).restSec).toBe(played);
  });

  it('fortime: estimated work × 1.15 + rest between rounds, capped by durationSec', () => {
    const items = [item('burpee', { reps: 10 }), item('air_squat', { reps: 15 })];
    const open = estimateDuration(
      one({
        id: 'f',
        format: 'fortime',
        sets: 3,
        durationSec: 900,
        restBetweenRoundsSec: 30,
        items,
      }),
    );
    // (40 + 37.5) × 3 × 1.15 = 267.375 + 2 × 30 = 327.375 + 20 intro
    expect(open.totalSec).toBe(347);
    const capped = estimateDuration(
      one({
        id: 'f',
        format: 'fortime',
        sets: 3,
        durationSec: 200,
        restBetweenRoundsSec: 30,
        items,
      }),
    );
    expect(capped.totalSec).toBe(220);
    expect(capped.workSec + capped.restSec).toBe(200);
  });

  it('accepts an empty workout gracefully', () => {
    const p = { ...prescribe(), blocks: [] };
    expect(estimateDuration(p)).toEqual({ totalSec: 0, workSec: 0, restSec: 0, perBlock: [] });
  });
});

describe('estimateCalories', () => {
  it('uses MET × kg × hours for work and REST_MET for rest, transitions and intros', () => {
    const p = one({ id: 'c', format: 'sets', sets: 1, items: [item('plank', { seconds: 60 })] });
    const work = (3.8 * 70 * 60) / 3600;
    const rest = (REST_MET * 70 * 28) / 3600;
    expect(estimateCalories(p, 70, fixtureLookup)).toBe(Math.round(work + rest));
  });

  it('splits AMRAP time 70/30 between work and rest', () => {
    const p = one({ id: 'a', format: 'amrap', durationSec: 600, items: [item('burpee')] });
    const work = (10 * 70 * 420) / 3600;
    const rest = (REST_MET * 70 * (180 + 20)) / 3600;
    expect(estimateCalories(p, 70, fixtureLookup)).toBe(Math.round(work + rest));
  });

  it('scales with body weight and falls back to the default weight', () => {
    const p = prescribe();
    const at70 = estimateCalories(p, 70, fixtureLookup);
    const at90 = estimateCalories(p, 90, fixtureLookup);
    expect(at90).toBeGreaterThan(at70);
    expect(Math.abs(at90 / at70 - 90 / 70)).toBeLessThan(0.02);
    expect(estimateCalories(p, undefined, fixtureLookup)).toBe(
      estimateCalories(p, DEFAULT_WEIGHT_KG, fixtureLookup),
    );
    expect(estimateCalories(p, 0, fixtureLookup)).toBe(at70);
  });

  it('uses a default MET when an exercise is unknown', () => {
    const p = one({ id: 'x', format: 'sets', sets: 1, items: [item('mystery', { reps: 10 })] });
    expect(estimateCalories(p, 70, fixtureLookup)).toBeGreaterThan(0);
  });
});

describe('estimatePoints', () => {
  it('applies the choice and the repeat multiplier, and nothing else', () => {
    expect(estimatePoints(FULL_WORKOUT, 'normal')).toBe(120);
    expect(estimatePoints(FULL_WORKOUT, 'harder')).toBe(150);
    expect(estimatePoints(FULL_WORKOUT, 'easier')).toBe(96);
    expect(estimatePoints(FULL_WORKOUT, 'normal', { repeat: true })).toBe(60);
    expect(estimatePoints(FULL_WORKOUT, 'harder', { repeat: true })).toBe(75);
  });

  it('cannot be raised by how many days in a row the athlete trained', () => {
    // The streak bonus used to add up to a fifth here. It is gone, and the point of this test is
    // that it stays gone: a course that schedules rest days must not price them as a loss.
    const plain = estimatePoints(FULL_WORKOUT, 'normal');
    for (const streakDays of [0, 7, 30, 365]) {
      expect(estimatePoints(FULL_WORKOUT, 'normal', { streakDays } as never)).toBe(plain);
    }
  });
});

/*
 * `workoutVolume` exists because the difficulty chooser could not tell its three options apart:
 * easier drops a whole set and shortens the rest to match, so the minutes and the calories come out
 * near enough identical and the screen offered three rows that looked the same. Reps do not lie.
 */
describe('estimateTrainingDuration', () => {
  /*
   * «Ты продолжаешь считать разминку и заминку. Этого делать не нужно.» The repetitions had already
   * dropped them; the minutes printed beside those repetitions had not, which is how the sheet came
   * to offer «Полегче 13 мин · 84 повтора» against «Посложнее 14 мин · 136 повторов».
   */
  it('leaves the warm-up and the cool-down out of the clock', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const whole = estimateDuration(p).totalSec;
    const training = estimateTrainingDuration(p).totalSec;
    expect(training).toBeGreaterThan(0);
    expect(training).toBeLessThan(whole);
  });

  it('is the one number that separates the three choices', () => {
    /*
     * The point of the change, stated as arithmetic. Whole-session minutes barely move between
     * easier and harder, because the ten fixed minutes at either end dominate; training minutes
     * move by more, and in the same direction the repetitions do.
     */
    const at = (choice: 'easier' | 'harder') =>
      prescribeWorkout(FULL_WORKOUT, { ...opts, choice }, fixtureLookup);
    const wholeSpread =
      estimateDuration(at('harder')).totalSec - estimateDuration(at('easier')).totalSec;
    const trainingSpread =
      estimateTrainingDuration(at('harder')).totalSec -
      estimateTrainingDuration(at('easier')).totalSec;
    expect(trainingSpread).toBe(wholeSpread);
    // The same gap, over a smaller total — which is what makes it visible at all.
    expect(estimateTrainingDuration(at('easier')).totalSec).toBeLessThan(
      estimateDuration(at('easier')).totalSec,
    );
  });
});

describe('workoutVolume', () => {
  it('counts every set of every rep-based item', () => {
    const p = one({ id: 's', format: 'sets', sets: 3, items: [item('air_squat', { reps: 10 })] });
    expect(workoutVolume(p).reps).toBe(30);
  });

  it('counts a per-side item twice: ten per leg is twenty', () => {
    const plain = one({
      id: 'a',
      format: 'sets',
      sets: 2,
      items: [item('air_squat', { reps: 10 })],
    });
    const perSide = one({
      id: 'b',
      format: 'sets',
      sets: 2,
      items: [item('air_squat', { reps: 10, perSide: true })],
    });
    expect(workoutVolume(perSide).reps).toBe(workoutVolume(plain).reps * 2);
  });

  /*
   * An EMOM's `sets` is its number of MINUTES, and the player spends each minute on one item:
   * `buildPlayerSteps` runs `for m in 1..sets` over `items[(m - 1) % n]`. Counting it like a set
   * scheme — every item once per set — charged the athlete three times over.
   *
   * It shipped, and the screen said so: «Форма с нуля», тренировка 1 is three minutes of 8 + 13 +
   * 13 and its preview read «3 мин · 102 повтора». The minutes were right and the reps were three
   * times the truth; the owner caught it by noticing the two could not both be true. Nothing here
   * noticed, which is why this exists — and why the test below states the claim against the player
   * itself rather than against a number written down.
   */
  it('walks an EMOM minute by minute instead of multiplying by its minutes', () => {
    const p = one({
      id: 'e',
      format: 'emom',
      rounds: 3,
      items: [
        item('knee_push_up', { reps: 8 }),
        item('air_squat', { reps: 13 }),
        item('dead_bug', { reps: 13 }),
      ],
    });
    // Three minutes, one movement each: 8 + 13 + 13. Not 3 × 34.
    expect(workoutVolume(p).reps).toBe(34);
  });

  it('gives a longer EMOM its extra minutes, wrapping round the items', () => {
    const p = one({
      id: 'e',
      format: 'emom',
      rounds: 5,
      items: [item('air_squat', { reps: 10 }), item('knee_push_up', { reps: 6 })],
    });
    // Minutes 1, 3 and 5 are squats, 2 and 4 are push-ups: 30 + 12.
    expect(workoutVolume(p).reps).toBe(42);
  });

  it('ignores work measured in seconds, and reports it as seconds instead', () => {
    const p = one({ id: 'h', format: 'sets', sets: 3, items: [item('plank', { seconds: 20 })] });
    const v = workoutVolume(p);
    expect(v.reps).toBe(0);
    expect(v.workSec).toBeGreaterThan(0);
  });

  /*
   * «Не надо считать разминку и заминку в плане тренировки и в количестве повторений.» The fixture
   * opens on a warm-up of ten squats and closes on a cool-down of ten glute bridges, and neither
   * is training — `docs/COACH_RULES.md` marks both «Counted as training? No».
   */
  it('leaves the warm-up and the cool-down out of the count', () => {
    const p = prescribeWorkout(FULL_WORKOUT, opts, fixtureLookup);
    const withEnds = workoutVolume(p).reps;
    const trainingOnly = workoutVolume({
      ...p,
      blocks: p.blocks.filter((b) => b.type !== 'warmup' && b.type !== 'cooldown'),
    }).reps;
    // Dropping them by hand changes nothing, because the function already did.
    expect(withEnds).toBe(trainingOnly);

    // And they really are reps that would otherwise land in the total.
    const endsOnly = workoutVolume({
      ...p,
      // `workoutVolume` filters by type, so re-label them to prove the reps exist at all.
      blocks: p.blocks
        .filter((b) => b.type === 'warmup' || b.type === 'cooldown')
        .map((b) => ({ ...b, type: 'strength' as const })),
    }).reps;
    expect(endsOnly).toBeGreaterThan(0);
  });

  it('separates the three difficulties far more clearly than the clock does', () => {
    const at = (choice: 'easier' | 'normal' | 'harder') =>
      workoutVolume(prescribeWorkout(FULL_WORKOUT, { ...opts, choice }, fixtureLookup));
    const easier = at('easier').reps;
    const normal = at('normal').reps;
    const harder = at('harder').reps;
    expect(easier).toBeLessThan(normal);
    expect(normal).toBeLessThan(harder);
    // The whole point: the spread is something a bar can draw and a person can feel.
    expect(harder - easier).toBeGreaterThan(normal * 0.1);
  });
});

/*
 * The claim this suite could not make before, and the one that matters: the figure on the preview
 * is the work the player will actually ask for.
 *
 * Every test above states it against a number written down here, which is exactly how the EMOM bug
 * survived — both sides of the disagreement were fixtures, and neither was the player. This walks
 * every workout of every shipped course and compares `workoutVolume` with the steps
 * `buildPlayerSteps` produces for the same prescription. If they ever part again, whatever the
 * format and whoever wrote the block, this is what says so.
 *
 * Counted by the item's unit rather than the step's mode: an EMOM step is a `timer` step (the
 * minute is the clock) whose target is nonetheless a number of repetitions, and reading `mode`
 * here would quietly drop exactly the format this test was written for.
 */
describe('the estimate and the player agree about every shipped workout', () => {
  const courses = allCourses();

  it('finds the courses at all', () => {
    expect(courses.length).toBeGreaterThan(0);
  });

  it.each(courses.map((c) => [c.id, c] as const))('%s', (_id, course) => {
    for (const w of course.workouts) {
      const p = prescribeWorkout(w, { ...opts, level: course.level });
      const training = new Set(
        p.blocks.filter((b) => b.type !== 'warmup' && b.type !== 'cooldown').map((b) => b.blockId),
      );
      const reps = (it: { unit?: string; target?: number; perSide?: boolean }) =>
        it.unit === 'reps' ? Math.max(0, it.target ?? 0) * (it.perSide ? 2 : 1) : 0;
      const asked = buildPlayerSteps(p).reduce((n, step) => {
        if (step.kind === 'done' || step.kind === 'rest') return n;
        if (!training.has(step.blockId)) return n;
        // A for-time or AMRAP block is one composite step holding its whole list: the athlete
        // works down it at their own pace rather than being walked through it. AMRAP counts one
        // round, for the reason the function's own comment gives.
        if (step.kind === 'fortime') {
          return n + step.rounds * step.items.reduce((t, it) => t + reps(it), 0);
        }
        if (step.kind === 'amrap') return n + step.items.reduce((t, it) => t + reps(it), 0);
        if (step.kind !== 'work') return n;
        return n + reps({ ...step.item, target: step.target ?? step.item.target });
      }, 0);
      expect({ workout: w.id, reps: workoutVolume(p).reps }).toEqual({
        workout: w.id,
        reps: asked,
      });
    }
  });
});
