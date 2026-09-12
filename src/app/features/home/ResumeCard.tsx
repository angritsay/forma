/**
 * "Resume workout" strip shown on Home while a session is in progress or finished but not saved.
 * Reads the persisted player store; renders nothing when there is no active session.
 *
 * It names the movement the athlete stopped on, because that is the promise the button is making:
 * the session comes back where it was left, mid-step and mid-countdown, not at the beginning.
 */
import { Button } from '@/components/ui/Button';
import { Glyph, Icon } from '@/components/ui/Icon';
import { courseTitle, findCourse } from '@/content/catalogue';
import { useT } from '@/app/hooks/useT';
import { stepTitle } from '@/app/features/player/model';
import { activeWorkoutPath, useActiveWorkoutStore } from '@/app/store/activeWorkout';

export interface ResumeCardProps {
  onResume: (path: string) => void;
}

export function ResumeCard({ onResume }: ResumeCardProps) {
  const { t, l, locale } = useT();
  const session = useActiveWorkoutStore((s) => s.session);
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);
  const steps = useActiveWorkoutStore((s) => s.steps);
  const stepIndex = useActiveWorkoutStore((s) => s.stepIndex);
  if (!session) return null;
  const path = activeWorkoutPath({ session, finishedAt });
  if (!path) return null;

  const course = findCourse(session.courseId);
  const workout = course?.workouts.find((w) => w.id === session.workoutId);
  const finished = finishedAt !== null;
  // Where it will pick up. A finished session has nothing left to name: it needs saving, not
  // resuming.
  const step = steps[stepIndex];
  const stoppedOn = !finished && step ? stepTitle(t, locale, step, session.prescribed) : '';

  return (
    /*
     * A marked strip, not a card. It sits right under the photograph of today's session, and an
     * unfinished workout has to read as an interruption to deal with rather than as a second offer
     * competing with it — hence the 2px white rule down its left edge.
     *
     * The button is under the words, not beside them: beside them it took half a 390px row, and
     * «Отжимания, приседания, «жук»» and the movement under it both ended in an ellipsis — which is
     * exactly the two facts this strip exists to state.
     */
    <section className="mt-6 flex flex-col gap-3 border-l-2 border-primary py-3 pl-4">
      <div className="min-w-0">
        <span className="eyebrow text-text">
          {t(finished ? 'app.homeResumeFinishedEyebrow' : 'app.homeResumeEyebrow')}
        </span>
        <h2 className="font-display mt-1 truncate text-lg leading-[1.24]">
          {workout ? l(workout.name) : t('app.homeResumeFallback')}
        </h2>
        {stoppedOn ? (
          <p className="truncate text-sm text-muted">
            {t('app.homeResumeAt', { name: stoppedOn })}
          </p>
        ) : course ? (
          <p className="truncate text-sm text-muted">{l(courseTitle(course))}</p>
        ) : null}
      </div>
      <Button
        size="md"
        fullWidth
        onClick={() => onResume(path)}
        icon={finished ? <Glyph size={14}>✓</Glyph> : <Icon name="play" size={14} />}
      >
        {t(finished ? 'app.homeResumeSave' : 'app.homeResumeCta')}
      </Button>
    </section>
  );
}
