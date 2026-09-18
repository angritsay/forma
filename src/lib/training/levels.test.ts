import { describe, expect, it } from 'vitest';
import { LEVEL_THRESHOLDS } from './constants';
import { ACHIEVEMENTS, evaluateAchievements, levelForPoints } from './levels';
import type { UserStats } from './types';

const stats = (o: Partial<UserStats> = {}): UserStats => ({
  workouts: 0,
  points: 0,
  bestWeek: 0,
  activeWeeks: 0,
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
      stats({ workouts: 5, points: 500, bestWeek: 3, activeWeeks: 2 }),
    );
    const byId = Object.fromEntries(r.map((a) => [a.id, a]));
    expect(byId.first_workout?.unlocked).toBe(true);
    expect(byId.workouts_5?.unlocked).toBe(true);
    expect(byId.workouts_10?.unlocked).toBe(false);
    expect(byId.workouts_10?.progress).toBeCloseTo(0.5);
    expect(byId.workouts_25?.unlocked).toBe(false);
    expect(byId.workouts_25?.progress).toBeCloseTo(0.2);
    expect(byId.week_three?.unlocked).toBe(true);
    expect(byId.weeks_8?.progress).toBeCloseTo(2 / 8);
    expect(byId.points_1000?.progress).toBe(0.5);
    expect(byId.first_benchmark?.unlocked).toBe(false);
  });

  it('unlocks everything for a veteran', () => {
    const r = evaluateAchievements(
      stats({
        workouts: 100,
        points: 10000,
        bestWeek: 3,
        activeWeeks: 8,
        benchmarksDone: 1,
        coursesCompleted: 1,
        totalMinutes: 600,
      }),
    );
    expect(r.every((a) => a.unlocked && a.progress === 1)).toBe(true);
  });

  it('has nothing that asks for consecutive days', () => {
    /*
     * The guard on the owner's instruction: a course with rest days in it must not carry an
     * achievement that a rest day breaks.
     *
     * The rule matches the *demand* — «N дней подряд», «N days in a row» — and not the bare word
     * «подряд», which «Два месяца в деле» uses to say the opposite: «подряд не обязательно». A
     * regex that fails on a line promising the athlete they may rest is measuring the wrong thing.
     */
    for (const a of ACHIEVEMENTS) {
      expect(a.id).not.toMatch(/streak/i);
      const copy = `${a.description.ru} ${a.description.en}`;
      expect(copy).not.toMatch(/дн\w*\s+подряд|days\s+in\s+a\s+row|streak/i);
    }
  });

  it('counts a good week and a long habit without them touching', () => {
    // Eight weeks spread over a year, one workout each: «Два месяца в деле» is earned.
    expect(
      evaluateAchievements(stats({ activeWeeks: 8 })).find((a) => a.id === 'weeks_8')?.unlocked,
    ).toBe(true);
    expect(
      evaluateAchievements(stats({ bestWeek: 3 })).find((a) => a.id === 'week_three')?.unlocked,
    ).toBe(true);
  });
});
