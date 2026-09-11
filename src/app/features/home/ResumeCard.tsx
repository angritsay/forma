/**
 * "Resume workout" card shown on Home while a session is in progress or finished but not saved.
 * Reads the persisted player store; renders nothing when there is no active session.
 */
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { findCourse } from '@/content/catalogue';
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

  const course = findCourse(session.courseId);
  const workout = course?.workouts.find((w) => w.id === session.workoutId);
  const finished = finishedAt !== null;

  return (
    /*
     * A marked strip, not a card. This sits directly above the photograph of today's session, and
     * an unfinished workout has to read as an interruption to deal with rather than as a second
     * offer competing with it — so it is one line with the accent marking its left edge.
     */
    <section className="flex items-center gap-4 border-l-2 border-accent py-3 pl-4">
      <div className="min-w-0 flex-1">
        <span className="eyebrow text-accent">
          {t(finished ? 'app.homeResumeFinishedEyebrow' : 'app.homeResumeEyebrow')}
        </span>
        <h2 className="font-display mt-1 truncate text-lg leading-[1.24]">
          {workout ? l(workout.name) : t('app.homeResumeFallback')}
        </h2>
        {course ? <p className="truncate text-sm text-muted">{l(course.name)}</p> : null}
      </div>
      <Button
        size="md"
        onClick={() => onResume(path)}
        icon={<Icon name={finished ? 'check' : 'play'} size={16} />}
      >
        {t(finished ? 'app.homeResumeSave' : 'app.homeResumeCta')}
      </Button>
    </section>
  );
}
