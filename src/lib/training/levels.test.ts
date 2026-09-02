import { describe, expect, it } from 'vitest';
import { LEVEL_THRESHOLDS } from './constants';
import { ACHIEVEMENTS, evaluateAchievements, levelForPoints } from './levels';
import type { UserStats } from './types';

const stats = (o: Partial<UserStats> = {}): UserStats => ({
  workouts: 0,
  points: 0,
  streakCurrent: 0,
  streakLongest: 0,
  stepsDaysAtGoal: 0,
  benchmarksDone: 0,
  coursesCompleted: 0,
  totalMinutes: 0,
  ...o,
});

describe('levelForPoints', () => {
  it('starts at level 1 "Rookie" with progress towards 300', () => {
    const l = levelForPoints(0);
    expect(l).toMatchObject({ level: 1, minPoints: 0, nextAt: 300, progress: 0 });
    expect(l.title).toEqual({ ru: 'Новичок', en: 'Rookie' });
    expect(levelForPoints(150).progress).toBe(0.5);
    expect(levelForPoints(299).level).toBe(1);
  });

  it('crosses thresholds exactly and reaches the top level', () => {
    expect(levelForPoints(300)).toMatchObject({
      level: 2,
      minPoints: 300,
      nextAt: 800,
      progress: 0,
    });
    expect(levelForPoints(1500).level).toBe(4);
    const top = levelForPoints(16000);
    expect(top).toMatchObject({ level: 10, minPoints: 16000, nextAt: null, progress: 1 });
    expect(top.title.en).toBe('Legend');
    expect(levelForPoints(50000).level).toBe(10);
  });

  it('guards negative or invalid points', () => {
    expect(levelForPoints(-100).level).toBe(1);
    expect(levelForPoints(Number.NaN)).toMatchObject({ level: 1, progress: 0 });
  });

  it('has a distinct bilingual title for each of the 10 levels', () => {
    const titles = LEVEL_THRESHOLDS.map((t) => levelForPoints(t).title);
    expect(new Set(titles.map((t) => t.en)).size).toBe(10);
    expect(new Set(titles.map((t) => t.ru)).size).toBe(10);
    for (const t of titles) expect(t.ru).toMatch(/[А-Яа-яЁё]/);
  });
});

describe('achievements', () => {
  it('defines at least 12 achievements with unique ids and bilingual copy', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.title.ru.trim()).not.toBe('');
      expect(a.title.en.trim()).not.toBe('');
      expect(a.description.ru).toMatch(/[А-Яа-яЁё]/);
      expect(a.icon.length).toBeGreaterThan(0);
    }
  });

  it('nothing is unlocked for a fresh athlete', () => {
    const r = evaluateAchievements(stats());
    expect(r.every((a) => !a.unlocked && a.progress === 0)).toBe(true);
    expect(r.map((a) => a.id)).toEqual(ACHIEVEMENTS.map((a) => a.id));
  });

  it('reports progress and unlocks at the documented thresholds', () => {
    const r = evaluateAchievements(
      stats({ workouts: 5, points: 500, streakLongest: 7, stepsDaysAtGoal: 4 }),
    );
    const byId = Object.fromEntries(r.map((a) => [a.id, a]));
    expect(byId.first_workout?.unlocked).toBe(true);
    expect(byId.workouts_5?.unlocked).toBe(true);
    expect(byId.workouts_25?.unlocked).toBe(false);
    expect(byId.workouts_25?.progress).toBeCloseTo(0.2);
    expect(byId.streak_7?.unlocked).toBe(true);
    expect(byId.streak_30?.progress).toBeCloseTo(7 / 30);
    expect(byId.points_1000?.progress).toBe(0.5);
    expect(byId.steps_10_days?.progress).toBe(0.4);
    expect(byId.first_benchmark?.unlocked).toBe(false);
  });

  it('unlocks everything for a veteran', () => {
    const r = evaluateAchievements(
      stats({
        workouts: 100,
        points: 10000,
        streakCurrent: 30,
        streakLongest: 30,
        stepsDaysAtGoal: 10,
        benchmarksDone: 1,
        coursesCompleted: 1,
        totalMinutes: 600,
      }),
    );
    expect(r.every((a) => a.unlocked && a.progress === 1)).toBe(true);
  });

  it('uses the current streak as well as the longest one', () => {
    const r = evaluateAchievements(stats({ streakCurrent: 3 }));
    expect(r.find((a) => a.id === 'streak_3')?.unlocked).toBe(true);
  });
});
