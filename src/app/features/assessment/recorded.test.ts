import { describe, expect, it } from 'vitest';
import type { BenchmarkSeries } from '@/lib/api/types';
import type { UserTrainingProfile } from '@/lib/training/types';
import { assessmentDone, recordedMoves } from './recorded';

const series = (key: string, value: number): BenchmarkSeries => ({
  key,
  latest: { key, value, recordedAt: '2026-09-01T00:00:00Z' } as BenchmarkSeries['latest'],
  history: [],
});

const profile = (tests: UserTrainingProfile['tests']) => ({ tests }) as UserTrainingProfile;

describe('recordedMoves', () => {
  it('reads three movements from the profile and two from the benchmarks', () => {
    const rows = recordedMoves(profile({ squats60s: 30, pushups: 10, plankSec: 45 }), [
      series('situps_60s', 22),
      series('lunges_60s', 18),
    ]);
    expect(rows.map((r) => [r.move.exerciseId, r.value])).toEqual([
      ['air_squat', 30],
      ['push_up', 10],
      ['sit_up', 22],
      ['reverse_lunge', 18],
      ['plank', 45],
    ]);
  });

  /*
   * Ноль отжиманий — это результат, а не пустота, и записать его надо. Спутать одно с другим
   * значило бы показать «ту ду» тому, кто тест уже прошёл, и предложить пройти его заново.
   */
  it('keeps a zero as an answer', () => {
    const rows = recordedMoves(profile({ pushups: 0 }), []);
    const pushups = rows.find((r) => r.move.exerciseId === 'push_up');
    expect(pushups?.value).toBe(0);
    expect(assessmentDone(rows)).toBe(false); // остальные четыре всё ещё не сданы
  });

  it('marks push-ups done on the knees, because they score differently', () => {
    const rows = recordedMoves(profile({ pushups: 8, pushupsOnKnees: true }), []);
    expect(rows.find((r) => r.move.exerciseId === 'push_up')?.onKnees).toBe(true);
    expect(rows.find((r) => r.move.exerciseId === 'air_squat')?.onKnees).toBe(false);
  });

  it('has nothing recorded for somebody who has not taken it', () => {
    const rows = recordedMoves(null, []);
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.value === undefined)).toBe(true);
  });
});

describe('assessmentDone', () => {
  /*
   * Все пять, а не «хоть что-то»: индекс формы считается по набору. Половина набора — не
   * результат, который можно показать и запретить переделывать.
   */
  it('is true only when every movement has an answer', () => {
    const all = recordedMoves(profile({ squats60s: 1, pushups: 1, plankSec: 1 }), [
      series('situps_60s', 1),
      series('lunges_60s', 1),
    ]);
    expect(assessmentDone(all)).toBe(true);

    const missingOne = recordedMoves(profile({ squats60s: 1, pushups: 1, plankSec: 1 }), [
      series('situps_60s', 1),
    ]);
    expect(assessmentDone(missingOne)).toBe(false);
    expect(assessmentDone([])).toBe(false);
  });
});
