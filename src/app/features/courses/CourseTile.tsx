import type { CSSProperties } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Course } from '@/content/schema';
import { useT } from '@/app/hooks/useT';
import type { CourseProgress } from '@/app/features/path/nodeState';
import {
  courseEquipmentForDisplay,
  courseLandingHref,
  courseSignatureExercise,
  perWeekLabel,
  weeksLabel,
} from './courseMeta';
import { EquipmentIcon } from './EquipmentIcon';
import { LinkButton } from './LinkButton';

export interface CourseTileProps {
  course: Course;
  owned: boolean;
  /** Null when the course has not been started. */
  progress: CourseProgress | null;
  onOpen: () => void;
}

/** Catalogue tile: gradient header with the figure, meta chips and the owned / locked CTA. */
export function CourseTile({ course, owned, progress, onOpen }: CourseTileProps) {
  const tr = useT();
  const { t, l, locale } = tr;
  const exercise = courseSignatureExercise(course);
  const style = { '--course-g1': course.gradient[0], '--course-g2': course.gradient[1] } as CSSProperties;
  const pct = progress?.pct ?? 0;
  const finished = progress !== null && progress.total > 0 && progress.done >= progress.total;
  const ownedLabel = finished
    ? t('app.coursesCompleted')
    : progress && progress.done > 0
      ? t('app.coursesContinue', { pct })
      : t('app.coursesStart');

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="hero-art flex items-start gap-4 p-5" style={style}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {owned ? (
              <Badge tone="on-art" icon="check">
                {t('app.coursesOwned')}
              </Badge>
            ) : (
              <Badge tone="on-art" icon="lock">
                {t('app.coursesLocked')}
              </Badge>
            )}
          </div>
          <h2 className="font-display mt-2 text-[26px] text-balance">{l(course.name)}</h2>
          <p className="mt-1 text-sm font-medium opacity-80">{l(course.tagline)}</p>
        </div>
        <ExerciseFigure
          animation={exercise?.animation ?? 'air_squat'}
          variant="thumb"
          className="size-24 shrink-0"
          label={exercise ? l(exercise.name) : undefined}
        />
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" icon="calendar">
            {weeksLabel(tr, course.weeks)}
          </Chip>
          <Chip size="sm" icon="refresh">
            {perWeekLabel(tr, course.sessionsPerWeek)}
          </Chip>
          <Chip size="sm" icon="clock">
            {t('app.coursesAvgMin', { n: course.avgSessionMin })}
          </Chip>
          <Chip size="sm" icon="star">
            {t(`common.level_${course.level}`)}
          </Chip>
          {courseEquipmentForDisplay(course).map((eq) => (
            <Chip
              key={eq}
              size="sm"
              icon={eq === 'none' ? undefined : <EquipmentIcon equipment={eq} size={14} />}
            >
              {t(`common.equipment_${eq}`)}
            </Chip>
          ))}
        </div>
        {owned ? (
          <>
            {progress && progress.done > 0 ? (
              <ProgressBar
                value={pct / 100}
                tone="accent"
                size="sm"
                label={l(course.name)}
                valueText={`${pct}%`}
              />
            ) : null}
            <Button fullWidth onClick={onOpen} iconRight={<Icon name="chevron" size={18} />}>
              {ownedLabel}
            </Button>
          </>
        ) : (
          <>
            <LinkButton
              href={courseLandingHref(locale, course)}
              fullWidth
              icon={<Icon name="lock" size={18} />}
            >
              {t('app.coursesGetAccess')}
            </LinkButton>
            <p className="text-center text-xs text-muted">{t('app.coursesBoughtHint')}</p>
          </>
        )}
      </div>
    </Card>
  );
}
