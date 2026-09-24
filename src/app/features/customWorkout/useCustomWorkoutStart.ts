/**
 * Starting a coach-built workout: turn its stored structure into a prescription, open a session
 * (course_id = 'custom'), hand it to the player. Used by the assigned-workout and share-link
 * screens alike.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useToast } from '@/components/ui/Toast';
import { withIntros } from '@/app/features/player/introViews';
import { unlockAudio } from '@/app/features/player/sound';
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
