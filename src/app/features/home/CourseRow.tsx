import type { ReactNode } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Course } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import { courseLandingHref, courseSignatureExercise } from '@/app/features/courses/courseMeta';

/** Titled horizontal scroller for course tiles. */
export function CourseRow({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">{title}</h2>
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {children}
      </div>
    </section>
  );
}

interface MiniCardProps {
  course: Course;
  /** Completed share, 0..100 (owned courses). */
  pct?: number;
  locked?: boolean;
  onOpen?: () => void;
}

/** Compact gradient tile: figure, name and either progress or a lock with a landing link. */
export function CourseMiniCard({ course, pct = 0, locked = false, onOpen }: MiniCardProps) {
  const { t, l, locale } = useT();
  const exercise = courseSignatureExercise(course);
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-[15px] font-semibold leading-tight">
          {l(course.name)}
        </span>
        {locked ? (
          <Badge tone="on-art" icon="lock">
            {t('app.homeCourseLocked')}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 items-end justify-between gap-2">
        <ExerciseFigure
          animation={exercise?.animation ?? 'air_squat'}
          variant="thumb"
          className="size-14 opacity-90"
        />
        {locked ? (
          <a
            href={courseLandingHref(locale, course)}
            className="text-sm font-semibold underline underline-offset-4"
          >
            {t('app.homeCourseGet')}
          </a>
        ) : null}
      </div>
      {!locked ? (
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={pct / 100} tone="primary" size="sm" label={l(course.name)} />
          <span className="tabular text-xs font-medium opacity-80">
            {t('app.homeCourseProgress', { pct })}
          </span>
        </div>
      ) : null}
    </>
  );
  const classes = 'flex h-44 w-44 shrink-0 snap-start flex-col gap-3';
  if (onOpen && !locked) {
    return (
      <Card gradient={course.gradient} padding="sm" className={classes} onClick={onOpen}>
        {body}
      </Card>
    );
  }
  return (
    <Card gradient={course.gradient} padding="sm" className={classes}>
      {body}
    </Card>
  );
}
