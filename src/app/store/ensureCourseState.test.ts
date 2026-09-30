/**
 * `ensureCourseState` and the progress wipe: a course-state list that failed to load must never be
 * read as «this course was never started», and the first row is created insert-only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/api/errors';
import type { CourseStateRow } from '@/lib/api/types';

const listCourseStates = vi.fn<() => Promise<CourseStateRow[]>>();
const createCourseState = vi.fn();
const upsertCourseState = vi.fn();
vi.mock('@/lib/api/courseState', () => ({
  listCourseStates: () => listCourseStates(),
  createCourseState: (...a: unknown[]) => createCourseState(...a),
  upsertCourseState: (...a: unknown[]) => upsertCourseState(...a),
}));
vi.mock('@/lib/api/sessions', () => ({
  listRecentSessions: () => Promise.resolve([]),
  listTrainedCourses: () => Promise.resolve([]),
}));
vi.mock('@/lib/api/benchmarks', () => ({ listBenchmarks: () => Promise.resolve([]) }));
vi.mock('@/lib/api/stats', () => ({ getMyTotals: () => Promise.resolve(null) }));

const { useProgress } = await import('./progress');
const { useSession } = await import('./session');

const row = (over: Partial<CourseStateRow> = {}): CourseStateRow => ({
  userId: 'u1',
  courseId: 'start',
  scale: 1.1,
  currentNodeIndex: 7,
  completedNodeIds: ['a', 'b'],
  updatedAt: '2026-09-01T00:00:00Z',
  ...over,
});

beforeEach(() => {
  listCourseStates.mockReset();
  createCourseState.mockReset();
  upsertCourseState.mockReset();
  useSession.setState({ user: { id: 'u1', email: '' }, profile: null });
  useProgress.getState().reset();
});

describe('ensureCourseState', () => {
  it('never writes a starting row when the list could not be read', async () => {
    listCourseStates.mockRejectedValue(new AppError('network', 'offline'));
    await expect(useProgress.getState().ensureCourseState('start')).rejects.toMatchObject({
      code: 'network',
    });
    expect(createCourseState).not.toHaveBeenCalled();
    expect(upsertCourseState).not.toHaveBeenCalled();
    expect(useProgress.getState().status).toBe('error');
  });

  it('returns the stored row without writing anything', async () => {
    listCourseStates.mockResolvedValue([row()]);
    const got = await useProgress.getState().ensureCourseState('start');
    expect(got.currentNodeIndex).toBe(7);
    expect(createCourseState).not.toHaveBeenCalled();
    expect(upsertCourseState).not.toHaveBeenCalled();
  });

  it('creates the row insert-only when the list was read and the course is missing', async () => {
    listCourseStates.mockResolvedValue([]);
    // The server already had a row (another device): insert-only hands back the stored one.
    createCourseState.mockResolvedValue(row());
    const got = await useProgress.getState().ensureCourseState('start');
    expect(createCourseState).toHaveBeenCalledWith('start', {
      scale: expect.any(Number),
      currentNodeIndex: 0,
      completedNodeIds: [],
    });
    expect(upsertCourseState).not.toHaveBeenCalled();
    expect(got.completedNodeIds).toEqual(['a', 'b']);
  });

  it('recovers once the retry reads the list', async () => {
    listCourseStates.mockRejectedValueOnce(new AppError('network', 'offline'));
    await expect(useProgress.getState().ensureCourseState('start')).rejects.toBeTruthy();
    listCourseStates.mockResolvedValue([row()]);
    await expect(useProgress.getState().ensureCourseState('start')).resolves.toMatchObject({
      currentNodeIndex: 7,
    });
    expect(createCourseState).not.toHaveBeenCalled();
  });
});
