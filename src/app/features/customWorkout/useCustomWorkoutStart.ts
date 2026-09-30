/**
 * Starting a coach-built workout: turn its stored structure into a prescription, open a session
 * (course_id = 'custom'), hand it to the player. Used by the assigned-workout and share-link
 * screens alike.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '@/components/ui/Toast';
import { withIntros } from '@/app/features/player/introViews';
import { startNeedsConfirm } from '@/app/features/player/ReplaceWorkout';
import { unlockAudio } from '@/app/features/player/sound';
import { isNetworkError } from '@/lib/api/errors';
import { startSession } from '@/lib/api/sessions';
import {
  buildPrescribedFromCustom,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import { toLocalDateIso } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import { useActiveWorkoutStore } from '@/app/store/activeWorkout';
import { useSession } from '@/app/store/session';

export interface StartableCustomWorkout {
  shortId: string;
  structure: CustomWorkoutStructure;
}

export function useCustomWorkoutStart() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  /** The workout waiting on «Есть незаконченная тренировка»; null when nothing is asked. */
  const [replacing, setReplacing] = useState<StartableCustomWorkout | null>(null);

  const begin = useCallback(
    async (workout: StartableCustomWorkout) => {
      // First thing, before any await: this is the tap that lets the player make sound — the
      // cues and the spoken names both — and a browser only honours it inside the gesture.
      unlockAudio();
      if (busy) return;
      setBusy(true);
      try {
        // The coach's explanations this session opens exercises with, decided now and stored with
        // it (bounded: a slow network starts the workout on the device's own counts).
        const prescribed = await withIntros(
          buildPrescribedFromCustom(workout.shortId, workout.structure),
        );
        const startedAt = new Date().toISOString();
        const { id: sessionId } = await startSession({
          // A custom workout is not part of a course: course_id 'custom' unlocks the sessions
          // insert path (can_play_custom), node_id / workout_id carry the workout's short id.
          courseId: 'custom',
          nodeId: workout.shortId,
          workoutId: workout.shortId,
          difficulty: 'normal',
          scale: 1,
          prescribed,
          localDate: toLocalDateIso(),
        });
        useActiveWorkoutStore.getState().begin({
          sessionId,
          courseId: 'custom',
          nodeId: workout.shortId,
          workoutId: workout.shortId,
          prescribed,
          startedAt,
          userId: useSession.getState().user?.id,
        });
        setReplacing(null);
        navigate('/play');
      } catch (e) {
        toast.show({
          kind: 'error',
          title: isNetworkError(e) ? t('app.nodeStartOffline') : t('app.nodeStartError'),
        });
      } finally {
        setBusy(false);
      }
    },
    [busy, navigate, toast, t],
  );

  /*
   * Beginning a session replaces the one on the device. This used to start straight over an
   * unsaved workout and lose it; now it asks first (`ReplaceWorkoutModal`), like the course preview.
   */
  const start = useCallback(
    (workout: StartableCustomWorkout) => {
      if (startNeedsConfirm()) {
        unlockAudio();
        setReplacing(workout);
        return;
      }
      void begin(workout);
    },
    [begin],
  );

  const confirmReplace = useCallback(() => {
    if (replacing) void begin(replacing);
  }, [begin, replacing]);
  const cancelReplace = useCallback(() => setReplacing(null), []);

  return { start, busy, replacing: replacing !== null, confirmReplace, cancelReplace };
}
