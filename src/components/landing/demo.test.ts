import { describe, expect, it } from 'vitest';
import { COURSE_BY_ID } from '@/content/registry';
import { estimateDuration, estimateTrainingDuration, prescribeWorkout } from '@/lib/training';
import { ADAPTATION } from '@/lib/training/constants';
import { DEMO_COURSE_ID, DEMO_PROFILE, firstWorkoutFacts, firstWorkoutIntro } from './demo';

describe('firstWorkoutFacts', () => {
  const course = COURSE_BY_ID.get(DEMO_COURSE_ID)!;
  const facts = firstWorkoutFacts('ru', course)!;

  it('describes the free workout the app opens: w_s01_emom and its three movements', () => {
    expect(facts.workoutId).toBe('w_s01_emom');
    expect(facts.nodeTitle).toBe('Тренировка 1');
    expect(facts.nodeSubtitle).toBe('По таймеру, 3 движения');
    expect(facts.moves.map((m) => m.exerciseId)).toEqual(['knee_push_up', 'air_squat', 'dead_bug']);
    expect(facts.moves[0]!.reps).toBe(8);
    expect(facts.moves.every((m) => m.href?.includes('/exercises/'))).toBe(true);
  });

  it('takes the minutes from the engine, and they do not move with the difficulty (EMOM)', () => {
    const workout = course.workouts.find((w) => w.id === facts.workoutId)!;
    const minutes = (['easier', 'normal', 'harder'] as const).map((choice) =>
      Math.round(
        estimateTrainingDuration(
          prescribeWorkout(workout, { profile: DEMO_PROFILE, scale: 1, choice, level: 2 }),
        ).totalSec / 60,
      ),
    );
    expect(new Set(minutes).size).toBe(1);
    expect(facts.workMinutes).toBe(minutes[0]);
    expect(facts.workMinutes).toBeGreaterThan(0);
    // One movement a minute: whole passes through the three never exceed the minutes.
    expect(facts.cycles * facts.moves.length).toBeLessThanOrEqual(facts.workMinutes);
  });

  it('counts Sergey’s three rounds: nine player minutes inside an 11-minute clock', () => {
    expect(facts.cycles).toBe(3);
    expect(facts.playerMinutes).toBe(9);
    // 9 work minutes + 2 rest minutes, plus the block intro, rounded to whole minutes.
    expect(facts.workMinutes).toBe(11);
  });

  it('says nine minutes of work in the intro, not the 11-minute clock', () => {
    const ru = firstWorkoutIntro('ru', facts);
    expect(ru).toContain('всего 9 мин работы');
    expect(ru).toContain(`около ${facts.totalMinutes} мин.`);
    expect(ru).not.toContain('11 мин работы');
    const en = firstWorkoutIntro('en', firstWorkoutFacts('en', course)!);
    expect(en).toContain('9 min of work');
  });

  it('gives the whole workout, warm-up and cool-down included, one engine figure for every choice', () => {
    const workout = course.workouts.find((w) => w.id === facts.workoutId)!;
    const minutes = (['easier', 'normal', 'harder'] as const).map((choice) =>
      Math.round(
        estimateDuration(
          prescribeWorkout(workout, { profile: DEMO_PROFILE, scale: 1, choice, level: 2 }),
        ).totalSec / 60,
      ),
    );
    expect(new Set(minutes).size).toBe(1);
    expect(facts.totalMinutes).toBe(minutes[0]);
    expect(facts.totalMinutes).toBeGreaterThan(facts.workMinutes);
  });

  it('quotes the easy-session step from the engine (+5)', () => {
    expect(facts.easyDeltaPercent).toBe(Math.round(ADAPTATION.easyDelta * 100));
  });

  it('speaks the page’s language', () => {
    expect(firstWorkoutFacts('en', course)!.nodeTitle).toBe('Workout 1');
  });
});
