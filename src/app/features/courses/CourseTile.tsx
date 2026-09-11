import type { CSSProperties } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  subscribeHref,
} from './courseMeta';
import { EquipmentIcon } from './EquipmentIcon';
import { PLAN_BY_ID, PLANS_ENABLED } from '@content/site/plans';
import { formatPrice } from '@content/site/pricing';
import { LinkButton } from './LinkButton';

const monthlyPlan = PLAN_BY_ID.get('monthly');

export interface CourseTileProps {
  course: Course;
  owned: boolean;
  /** Null when the course has not been started. */
  progress: CourseProgress | null;
  /** 1-based position in the catalogue, drawn as the entry's numeral. */
  n?: number;
  onOpen: () => void;
}

/**
 * One course in the catalogue: numeral, tile-mounted figure, name, specification, action.
 *
 * This was a bordered card split into a filled header and a filled body — two surfaces stacked
 * inside a third, five times down the screen. It is a catalogue entry now: the course's own tile
 * is the only filled thing in it, and hairlines separate the name from the specification from the
 * action, which is the order a course is actually read in.
 */
export function CourseTile({ course, owned, progress, n, onOpen }: CourseTileProps) {
  const tr = useT();
  const { t, l, locale } = tr;
  const exercise = courseSignatureExercise(course);
  const style = { '--course-tile': course.tile } as CSSProperties;
  const pct = progress?.pct ?? 0;
  const finished = progress !== null && progress.total > 0 && progress.done >= progress.total;
  const ownedLabel = finished
    ? t('app.coursesCompleted')
    : progress && progress.done > 0
      ? t('app.coursesContinue', { pct })
      : t('app.coursesStart');

  return (
    <article className="flex flex-col border-t border-border pt-5">
      <div className="flex items-start gap-4">
        {n !== undefined ? (
          <span className="numeral pt-1 text-sm text-accent">{String(n).padStart(2, '0')}</span>
        ) : null}
        <span
          className="hero-art flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-tile"
          style={style}
        >
          <ExerciseFigure
            animation={exercise?.animation ?? 'air_squat'}
            variant="thumb"
            className="size-16"
            label={exercise ? l(exercise.name) : undefined}
          />
        </span>
        <div className="min-w-0 flex-1">
          {owned ? (
            <Badge tone="success" icon="check">
              {t('app.coursesOwned')}
            </Badge>
          ) : (
            <Badge tone="neutral" icon="lock">
              {t('app.coursesLocked')}
            </Badge>
          )}
          <h2 className="font-display mt-2 text-xl text-balance">{l(course.name)}</h2>
          <p className="mt-1 text-sm text-muted">{l(course.tagline)}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4">
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
            <Button fullWidth onClick={onOpen} iconRight={<Icon name="chevron" size={16} />}>
              {ownedLabel}
            </Button>
          </>
        ) : (
          <>
            {PLANS_ENABLED && monthlyPlan ? (
              <>
                <LinkButton
                  href={subscribeHref(locale)}
                  fullWidth
                  icon={<Icon name="lock" size={16} />}
                >
                  {t('app.coursesSubscribe')}
                </LinkButton>
                <p className="text-center text-xs text-muted">
                  {t('app.coursesSubscribeHint', { price: formatPrice(locale, monthlyPlan.price) })}
                </p>
                <LinkButton href={courseLandingHref(locale, course)} variant="secondary" fullWidth>
                  {t('app.coursesBuyOne')}
                </LinkButton>
              </>
            ) : (
              <>
                <LinkButton
                  href={courseLandingHref(locale, course)}
                  fullWidth
                  icon={<Icon name="lock" size={16} />}
                >
                  {t('app.coursesGetAccess')}
                </LinkButton>
                <p className="text-center text-xs text-muted">{t('app.coursesBoughtHint')}</p>
              </>
            )}
          </>
        )}
      </div>
    </article>
  );
}
