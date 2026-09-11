import type { ReactNode } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Glyph } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Course } from '@/content/schema';
import { courseTileVars } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { courseLandingHref, courseSignatureExercise } from '@/app/features/courses/courseMeta';

export interface CourseRowProps {
  title: ReactNode;
  /** Range marker set opposite the title, e.g. "01–04". */
  index?: ReactNode;
  children: ReactNode;
}

/**
 * A titled index of courses.
 *
 * This was a horizontally scrolling shelf of 176×176 gradient tiles — the shape every content app
 * uses, and much of why the home screen read as a feed. It is a vertical ruled list now: the
 * title sits opposite a range marker, and each course is a row. Nothing hides off the right edge,
 * which on a 390px screen was most of the third tile.
 */
export function CourseRow({ title, index, children }: CourseRowProps) {
  return (
    <section className="mt-6 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5 pb-1">
        <h2 className="font-display text-xl">{title}</h2>
        {index ? <span className="eyebrow">{index}</span> : null}
      </div>
      {children}
    </section>
  );
}

interface MiniCardProps {
  course: Course;
  /** Completed share, 0..100 (owned courses). */
  pct?: number;
  locked?: boolean;
  /** 1-based position in the list, drawn as the row's numeral. */
  n?: number;
  onOpen?: () => void;
}

/**
 * One course as a ruled row: numeral, pictogram on its course tile, name, progress.
 *
 * The tile is the one place on the home screen the programme colour lands — the row carries
 * `--course-tile`, so the square and the 4px progress fill take the course's colour and the figure
 * draws in the ink that colour wants. The numeral stays grey; a list of positions is not a list of
 * current days. A locked course keeps the same row rather than becoming a different object: it is
 * dimmed, and its trailing mark is an arrow leading out to the page where access is bought.
 */
export function CourseMiniCard({ course, pct = 0, locked = false, n, onOpen }: MiniCardProps) {
  const { t, l, locale } = useT();
  const exercise = courseSignatureExercise(course);
  const vars = courseTileVars(course.tile);

  const body = (
    <>
      {n !== undefined ? (
        <span className="numeral pt-0.5 text-sm text-muted">{String(n).padStart(2, '0')}</span>
      ) : null}
      <span className="hero-art flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-tile">
        <ExerciseFigure
          animation={exercise?.animation ?? 'air_squat'}
          variant="thumb"
          className="size-9"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block truncate text-[15px] leading-[1.24]">
          {l(course.name)}
        </span>
        {locked ? (
          <span className="mt-0.5 block truncate text-xs text-muted">
            {t('app.homeCourseLocked')}
          </span>
        ) : (
          <span className="mt-2 flex flex-col gap-1">
            <ProgressBar value={pct / 100} size="sm" label={l(course.name)} />
            <span className="tabular text-xs text-muted">
              {t('app.homeCourseProgress', { pct })}
            </span>
          </span>
        )}
      </span>
      <Glyph size={16} className="shrink-0 text-muted-2">
        {locked ? '→' : '›'}
      </Glyph>
    </>
  );

  const classes =
    'flex w-full items-center gap-3.5 border-t border-border py-4 text-left first:border-t-0';

  if (locked) {
    return (
      <a
        href={courseLandingHref(locale, course)}
        className={`${classes} opacity-50`}
        style={vars}
        aria-label={`${l(course.name)} — ${t('app.homeCourseGet')}`}
      >
        {body}
      </a>
    );
  }
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={classes} style={vars}>
        {body}
      </button>
    );
  }
  return (
    <div className={classes} style={vars}>
      {body}
    </div>
  );
}
