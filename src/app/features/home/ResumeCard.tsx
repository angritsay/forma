/**
 * "Resume workout" card shown on Home while a session is in progress or finished but not saved.
 * Reads the persisted player store; renders nothing when there is no active session.
 */
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { COURSE_BY_ID } from '@/content/registry';
import { useT } from '@/app/hooks/useT';
import { activeWorkoutPath, useActiveWorkoutStore } from '@/app/store/activeWorkout';

export interface ResumeCardProps {
  onResume: (path: string) => void;
}

export function ResumeCard({ onResume }: ResumeCardProps) {
  const { t, l } = useT();
  const session = useActiveWorkoutStore((s) => s.session);
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);
  if (!session) return null;
  const path = activeWorkoutPath({ session, finishedAt });
  if (!path) return null;

  const course = COURSE_BY_ID.get(session.courseId);
  const workout = course?.workouts.find((w) => w.id === session.workoutId);
  const finished = finishedAt !== null;

  return (
    <Card level={2} padding="md" className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <span className="eyebrow">
          {t(finished ? 'app.homeResumeFinishedEyebrow' : 'app.homeResumeEyebrow')}
        </span>
        <h2 className="mt-1 truncate text-lg font-semibold">
          {workout ? l(workout.name) : t('app.homeResumeFallback')}
        </h2>
        {course ? <p className="truncate text-sm text-muted">{l(course.name)}</p> : null}
      </div>
      <Button
        size="md"
        onClick={() => onResume(path)}
        icon={<Icon name={finished ? 'check' : 'play'} size={18} />}
      >
        {t(finished ? 'app.homeResumeSave' : 'app.homeResumeCta')}
      </Button>
    </Card>
  );
}
