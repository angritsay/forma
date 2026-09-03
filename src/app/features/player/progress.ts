/**
 * Push a saved session into the home area's progress store so Home and the course path update
 * immediately (no extra round trip), then refresh in the background for the server-computed
 * parts (all-time totals, benchmark history). Failures are logged, never surfaced: the save
 * itself already succeeded and the store refreshes again on its own schedule.
 */
import { useProgress } from '@/app/store/progress';
import type { SaveOutcome } from './save';

export function publishSessionResult(outcome: SaveOutcome): void {
  try {
    const progress = useProgress.getState();
    progress.putSession(outcome.row);
    progress.putCourseState(outcome.courseState);
    void progress.refresh().catch((e: unknown) => {
      console.warn('[player] progress refresh failed', e);
    });
  } catch (e) {
    console.warn('[player] progress update failed', e);
  }
}
