/**
 * Starting a coach-built workout: turn its stored structure into a prescription, open a session
 * (course_id = 'custom'), hand it to the player. Used by the assigned-workout and share-link
 * screens alike.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '@/components/ui/Toast';
import { startSession } from '@/lib/api/sessions';
import {
  buildPrescribedFromCustom,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import { toLocalDateIso } from '@/lib/util/dates';
import { useT } from '@/app/hooks/useT';
import { useActiveWorkoutStore } from '@/app/store/activeWorkout';

export interface StartableCustomWorkout {
  shortId: string;
  structure: CustomWorkoutStructure;
}

export function useCustomWorkoutStart() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const start = useCallback(
    async (workout: StartableCustomWorkout) => {
      if (busy) return;
      setBusy(true);
      try {
        const prescribed = buildPrescribedFromCustom(workout.shortId, workout.structure);
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
        });
        navigate('/play');
      } catch {
        toast.show({ kind: 'error', title: t('app.nodeStartError') });
      } finally {
        setBusy(false);
      }
    },
    [busy, navigate, toast, t],
  );

  return { start, busy };
}
