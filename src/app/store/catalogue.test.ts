import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * A catalogue that failed at launch used to stay failed until the app was restarted, and a course
 * written in the admin panel then showed its days empty. It now retries on its own, and a purchase
 * can ask for a fresh copy.
 */

const listPublishedCourses = vi.fn();
const listExerciseCatalog = vi.fn();
vi.mock('@/lib/api/courseBuilder', () => ({ listPublishedCourses }));
vi.mock('@/lib/api/exercises', () => ({ listExerciseCatalog }));

async function load() {
  vi.resetModules();
  return import('./catalogue');
}

afterEach(() => {
  vi.useRealTimers();
  listPublishedCourses.mockReset();
  listExerciseCatalog.mockReset();
});

describe('useCatalogue', () => {
  it('retries by itself after a failed load', async () => {
    vi.useFakeTimers();
    listPublishedCourses.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
    listExerciseCatalog.mockResolvedValue([]);
    const { useCatalogue, CATALOGUE_RETRY_MS } = await load();
    await useCatalogue.getState().load();
    expect(useCatalogue.getState().status).toBe('error');
    await vi.advanceTimersByTimeAsync(CATALOGUE_RETRY_MS[0]);
    expect(useCatalogue.getState().status).toBe('ready');
    expect(listPublishedCourses).toHaveBeenCalledTimes(2);
  });

  it('loads once, but refreshes on request', async () => {
    listPublishedCourses.mockResolvedValue([]);
    listExerciseCatalog.mockResolvedValue([]);
    const { useCatalogue } = await load();
    await useCatalogue.getState().load();
    await useCatalogue.getState().load();
    expect(listPublishedCourses).toHaveBeenCalledTimes(1);
    await useCatalogue.getState().refresh();
    expect(listPublishedCourses).toHaveBeenCalledTimes(2);
  });
});
