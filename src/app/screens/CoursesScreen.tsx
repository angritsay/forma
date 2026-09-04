/**
 * Courses catalogue: every course as a tile — owned ones continue into the path, locked ones
 * link to the landing course page where access is bought.
 */
import { useNavigate } from 'react-router';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { COURSES } from '@/content/registry';
import { useT } from '@/app/hooks/useT';
import { CourseTile } from '@/app/features/courses/CourseTile';
import { courseProgress } from '@/app/features/path/nodeState';
import { useProgress, useProgressLoader } from '@/app/store/progress';
import { useSession } from '@/app/store/session';

export default function CoursesScreen() {
  useProgressLoader();
  const { t } = useT();
  const navigate = useNavigate();
  const entitlements = useSession((s) => s.entitlements);
  const status = useProgress((s) => s.status);
  const courseStates = useProgress((s) => s.courseStates);

  const owned = COURSES.filter((c) => entitlements.includes(c.id));
  const locked = COURSES.filter((c) => !entitlements.includes(c.id));
  // Without the course states an owned, half-finished course would read "Start the course".
  const pending = status === 'idle' || status === 'loading';

  return (
    <Screen>
      <div className="flex flex-col gap-5 py-4">
        <PageTitle title={t('app.coursesTitle')} subtitle={t('app.coursesLead')} />
        <div className="flex flex-col gap-4">
          {pending
            ? COURSES.map((course) => <Skeleton key={course.id} rounded="card" className="h-72" />)
            : [...owned, ...locked].map((course) => {
                const isOwned = entitlements.includes(course.id);
                const state = courseStates[course.id];
                return (
                  <CourseTile
                    key={course.id}
                    course={course}
                    owned={isOwned}
                    progress={state ? courseProgress(course.nodes, state) : null}
                    onOpen={() => navigate(`/courses/${course.id}`)}
                  />
                );
              })}
        </div>
      </div>
    </Screen>
  );
}
