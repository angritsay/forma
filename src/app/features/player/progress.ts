/**
 * Ask the home area's progress store to reload after a session is saved, so the path, streak
 * and "Today" card reflect the new state. Failures are logged, never surfaced: the save itself
 * already succeeded and the store refreshes again on its own schedule.
 */
import { useProgress } from '@/app/store/progress';

export async function refreshProgress(): Promise<void> {
  try {
    await useProgress.getState().refresh();
  } catch (e) {
    console.warn('[player] progress refresh failed', e);
  }
}
