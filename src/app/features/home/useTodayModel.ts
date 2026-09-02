/**
 * What the Home "Today" card shows: the next node of the active course (with the `normal`
 * estimate for workouts), a rest day, a milestone, a finished course, or "pick a course".
 */
import { useMemo } from 'react';
import { COURSE_BY_ID } from '@/content/registry';
import type { Course, CourseNode, Exercise, Workout } from '@/content/schema';
import { STEPS_GOAL } from '@/lib/training/constants';
import { estimateDuration } from '@/lib/training/estimate';
import { prescribeWorkout } from '@/lib/training/prescribe';
import type { PrescribeOptions } from '@/lib/training/types';
import { nextNode } from '@/app/features/path/nodeState';
import { workoutSignatureExercise } from '@/app/features/path/plan';
import { useTrainingContext } from '@/app/features/path/useTrainingContext';
import {
  startingScale,
  useActiveCourseId,
  useCourseStateRow,
  useStepsToday,
  useStreak,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

export type TodayModel =
  | { kind: 'none' }
  | { kind: 'completed'; course: Course }
  | {
      kind: 'workout';
      course: Course;
      node: CourseNode;
      workout: Workout;
      exercise: Exercise | undefined;
      /** Estimates for "As usual"; null when the training profile is missing. */
      durationSec: number | null;
      points: number | null;
      repeat: boolean;
    }
  | { kind: 'rest'; course: Course; node: CourseNode; goal: number; stepsToday: number }
  | { kind: 'milestone'; course: Course; node: CourseNode };

export function useTodayModel(): TodayModel {
  const courseId = useActiveCourseId();
  const row = useCourseStateRow(courseId);
  const stepsToday = useStepsToday();
  const streak = useStreak();
  const ctx = useTrainingContext();
  const profile = useSession((s) => s.profile);

  return useMemo<TodayModel>(() => {
    const course = courseId ? COURSE_BY_ID.get(courseId) : undefined;
    if (!course) return { kind: 'none' };
    const node = nextNode(course, row);
    if (!node) return { kind: 'completed', course };
    switch (node.kind) {
      case 'rest':
        return { kind: 'rest', course, node, goal: node.stepsGoal ?? STEPS_GOAL, stepsToday };
      case 'milestone':
        return { kind: 'milestone', course, node };
      case 'workout':
      case 'test':
      case 'benchmark': {
        const workout = course.workouts.find((w) => w.id === node.workoutId);
        if (!workout) return { kind: 'milestone', course, node };
        const repeat = row?.completedNodeIds.includes(node.id) ?? false;
        let durationSec: number | null = null;
        let points: number | null = null;
        if (ctx.profile) {
          const opts: PrescribeOptions = {
            profile: ctx.profile,
            scale: row?.scale ?? startingScale(profile),
            choice: 'normal',
            level: ctx.level,
            deload: node.deload === true,
            repeat,
            streakDays: streak.current,
          };
          const prescribed = prescribeWorkout(workout, opts);
          durationSec = estimateDuration(prescribed).totalSec;
          points = prescribed.points;
        }
        return {
          kind: 'workout',
          course,
          node,
          workout,
          exercise: workoutSignatureExercise(workout),
          durationSec,
          points,
          repeat,
        };
      }
    }
  }, [courseId, row, stepsToday, streak.current, ctx, profile]);
}
