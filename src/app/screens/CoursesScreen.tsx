/**
 * Courses catalogue: every course as a card — owned ones continue into the path, locked ones
 * link to the landing course page where access is bought.
 */
import { useNavigate } from 'react-router';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useT } from '@/app/hooks/useT';
import { CourseTile } from '@/app/features/courses/CourseTile';
import { courseProgress } from '@/app/features/path/nodeState';
import { useCatalogue } from '@/app/store/catalogue';
import { useProgress, useProgressLoader } from '@/app/store/progress';
import { useSession } from '@/app/store/session';

export default function CoursesScreen() {
  useProgressLoader();
  const { t } = useT();
  const navigate = useNavigate();
  const entitlements = useSession((s) => s.entitlements);
  const status = useProgress((s) => s.status);
  const courseStates = useProgress((s) => s.courseStates);

  const courses = useCatalogue((s) => s.courses);
  const owned = courses.filter((c) => entitlements.includes(c.id));
  const locked = courses.filter((c) => !entitlements.includes(c.id));
  // Without the course states an owned, half-finished course would read "Start the course".
  const pending = status === 'idle' || status === 'loading';

  return (
    <Screen>
      <div className="flex flex-col gap-6 py-5">
        <PageTitle display title={t('app.coursesTitle')} subtitle={t('app.coursesLead')} />
        {/*
          Owned courses come first and the numerals follow that order rather than the content's,
          because the number is a position in this list. Two columns from `lg`: five courses in
          one column on a desktop is a lot of scrolling for a catalogue whose whole job is
          comparison.
        */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {pending
            ? courses.map((course) => <Skeleton key={course.id} rounded="card" className="h-80" />)
            : [...owned, ...locked].map((course, i) => {
                const isOwned = entitlements.includes(course.id);
                const state = courseStates[course.id];
                return (
                  <CourseTile
                    key={course.id}
                    course={course}
                    owned={isOwned}
                    n={i + 1}
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
