/**
 * The summary save when it fails: which failure it was, whether a retry can help, the way out,
 * and a resumed save that never writes a stage — or a benchmark — twice.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n/index';
import { AppError } from '@/lib/api/errors';
import { block, fixtureLookup, item, profile, workout } from '@/lib/training/fixtures.test-helpers';
import { buildPlayerSteps } from '@/lib/training/player';
import { prescribeWorkout } from '@/lib/training/prescribe';
import type { PlayerResult } from '@/app/store/activeWorkout';

const completeSession = vi.fn();
const getCourseState = vi.fn();
const upsertCourseState = vi.fn();
const recordBenchmark = vi.fn();
vi.mock('@/lib/api/sessions', () => ({
  completeSession: (...a: unknown[]) => completeSession(...a),
  getSession: vi.fn(),
}));
vi.mock('@/lib/api/courseState', () => ({
  getCourseState: (...a: unknown[]) => getCourseState(...a),
  upsertCourseState: (...a: unknown[]) => upsertCourseState(...a),
}));
vi.mock('@/lib/api/benchmarks', () => ({
  recordBenchmark: (...a: unknown[]) => recordBenchmark(...a),
}));

const { createSummarySaver, memoryProgressStore, saveErrorKind, saveRetryable } =
  await import('./save');
const { SummaryFooter } = await import('@/app/screens/SummaryScreen');

const w = workout({
  id: 'w_test',
  blocks: [
    block({
      id: 'test',
      type: 'test',
      format: 'sets',
      sets: 1,
      scalable: false,
      items: [item('push_up', { seconds: 120 }), item('plank', { seconds: 300 })],
    }),
  ],
});
const prescribed = prescribeWorkout(
  w,
  { profile: profile(), scale: 1, choice: 'normal', level: 2 },
  fixtureLookup,
);
const steps = buildPlayerSteps(prescribed);
const work = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'work');
const results: PlayerResult[] = [
  {
    stepIndex: work[0]!.i,
    blockId: 'test',
    exerciseId: 'push_up',
    completed: true,
    testValue: 27,
    testUnit: 'reps',
  },
  {
    stepIndex: work[1]!.i,
    blockId: 'test',
    exerciseId: 'plank',
    completed: true,
    testValue: 95,
    testUnit: 'seconds',
  },
];
const input = {
  session: {
    sessionId: 's1',
    courseId: 'custom',
    nodeId: 'cw_x',
    workoutId: 'cw_x',
    prescribed,
    startedAt: '2026-09-30T10:00:00Z',
  },
  steps,
  results,
  feedback: { rpe: 6, feeling: 'ok' as const },
  completedAt: '2026-09-30T10:30:00Z',
  elapsedSec: 1500,
};

beforeEach(() => {
  for (const f of [completeSession, getCourseState, upsertCourseState, recordBenchmark]) {
    f.mockReset();
  }
  completeSession.mockImplementation(async (id: string) => ({ id }));
  getCourseState.mockResolvedValue(null);
  upsertCourseState.mockResolvedValue({ courseId: 'custom' });
  recordBenchmark.mockResolvedValue(undefined);
});

describe('saveErrorKind', () => {
  it('names each failure the summary screen speaks about', () => {
    expect(saveErrorKind(new AppError('network', 'offline'))).toBe('offline');
    expect(saveErrorKind(new AppError('validation', 'too_many_sessions_today'))).toBe(
      'daily_limit',
    );
    expect(saveErrorKind(new AppError('not_found', 'PGRST116'))).toBe('gone');
    expect(saveErrorKind(new AppError('auth', 'jwt expired'))).toBe('auth');
    expect(saveErrorKind(new Error('boom'))).toBe('generic');
  });

  it('offers no retry where none can succeed', () => {
    expect(saveRetryable('daily_limit')).toBe(false);
    expect(saveRetryable('gone')).toBe(false);
    expect(saveRetryable('offline')).toBe(true);
    expect(saveRetryable('auth')).toBe(true);
  });
});

describe('SummaryFooter', () => {
  const render = (errorKind: Parameters<typeof SummaryFooter>[0]['errorKind']) =>
    renderToStaticMarkup(
      createElement(SummaryFooter, {
        status: 'error',
        errorKind,
        canSave: true,
        onSave: () => {},
        onDiscard: () => {},
      }),
    );

  it('the daily limit says so and offers only «Не сохранять»', () => {
    const html = render('daily_limit');
    expect(html).toContain(t('ru', 'app.summarySaveDailyLimit'));
    expect(html).toContain(t('ru', 'app.summaryDiscard'));
    expect(html).not.toContain(t('ru', 'common.retry'));
  });

  it('a lost session is named, and the way out is the same', () => {
    const html = render('gone');
    expect(html).toContain(t('ru', 'app.summarySaveGone'));
    expect(html).toContain(t('ru', 'app.summaryDiscard'));
  });

  it('an offline failure keeps the retry first and the way out beside it', () => {
    const html = render('offline');
    expect(html).toContain(t('ru', 'common.errorOffline'));
    expect(html.indexOf(t('ru', 'common.retry'))).toBeLessThan(
      html.indexOf(t('ru', 'app.summaryDiscard')),
    );
  });
});

describe('createSummarySaver', () => {
  it('a remounted save resumes after the last stage and records no benchmark twice', async () => {
    const store = memoryProgressStore();
    recordBenchmark.mockResolvedValueOnce(undefined);
    recordBenchmark.mockRejectedValueOnce(new AppError('network', 'offline'));
    await expect(createSummarySaver(input, store)()).rejects.toMatchObject({ code: 'network' });
    expect(completeSession).toHaveBeenCalledTimes(1);
    expect(recordBenchmark).toHaveBeenCalledTimes(2);

    // A new saver — the screen was left and opened again — over the same kept progress.
    const outcome = await createSummarySaver(input, store)();
    expect(completeSession).toHaveBeenCalledTimes(1);
    expect(upsertCourseState).toHaveBeenCalledTimes(1);
    expect(recordBenchmark).toHaveBeenCalledTimes(3);
    expect(recordBenchmark.mock.calls.map((c) => c[0])).toEqual(['push_up', 'plank', 'plank']);
    expect(outcome.benchmarksRecorded).toBe(2);
  });

  it('feedback changed after a failed first stage is what gets saved', async () => {
    completeSession.mockRejectedValueOnce(new AppError('network', 'offline'));
    const save = createSummarySaver(input);
    await expect(save()).rejects.toBeTruthy();
    await save({ rpe: 9, feeling: 'hard' });
    expect(completeSession.mock.calls.at(-1)?.[1]).toMatchObject({ rpe: 9, feeling: 'hard' });
  });
});
