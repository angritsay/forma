import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Course } from '@/content/schema';
import { courseTileVars } from '@/lib/ui/tile';
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
 * One course in the catalogue, the design system's CourseCard: a band in the programme colour
 * with the course's figure drawn on it in the ink that colour wants, a dark stamp in its corner
 * saying whether you have it, then the name in the display face, the specification in muted
 * text, a 4px progress rule and the action. A 1px hairline frames the whole card; no shadow, no
 * radius, and the tile is the only thing on the screen that is not black or white.
 */
export function CourseTile({ course, owned, progress, n, onOpen }: CourseTileProps) {
  const tr = useT();
  const { t, l, locale } = tr;
  const exercise = courseSignatureExercise(course);
  const pct = progress?.pct ?? 0;
  const finished = progress !== null && progress.total > 0 && progress.done >= progress.total;
  const ownedLabel = finished
    ? t('app.coursesCompleted')
    : progress && progress.done > 0
      ? t('app.coursesContinue', { pct })
      : t('app.coursesStart');

  return (
    <article
      className="flex flex-col border border-border bg-surface"
      style={courseTileVars(course.tile)}
    >
      <div className="hero-art relative flex h-36 items-center justify-center">
        <ExerciseFigure
          animation={exercise?.animation ?? 'air_squat'}
          variant="thumb"
          className="size-24"
          label={exercise ? l(exercise.name) : undefined}
        />
        <Badge tone="on-art" className="absolute top-3 right-3">
          {owned ? t('app.coursesOwned') : t('app.coursesLocked')}
        </Badge>
        {n !== undefined ? (
          <span className="numeral absolute top-3 left-3 text-sm text-current opacity-70">
            {String(n).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 p-4">
        <div>
          <h2 className="font-display text-[15px] leading-[1.3] text-balance">{l(course.name)}</h2>
          <p className="mt-1 text-[13px] text-muted">{l(course.tagline)}</p>
        </div>
        {/* The specification as capitals chips — words, no pictograms; the word says what it is. */}
        <div className="flex flex-wrap gap-2">
          <Chip size="sm">{weeksLabel(tr, course.weeks)}</Chip>
          <Chip size="sm">{perWeekLabel(tr, course.sessionsPerWeek)}</Chip>
          <Chip size="sm">{t('app.coursesAvgMin', { n: course.avgSessionMin })}</Chip>
          <Chip size="sm">{t(`common.level_${course.level}`)}</Chip>
          {courseEquipmentForDisplay(course).map((eq) => (
            <Chip key={eq} size="sm">
              {t(`common.equipment_${eq}`)}
            </Chip>
          ))}
        </div>
        {owned ? (
          <>
            {progress && progress.done > 0 ? (
              <ProgressBar
                value={pct / 100}
                label={l(course.name)}
                valueText={`${pct}%`}
                className="mt-1"
              />
            ) : null}
            <Button fullWidth onClick={onOpen} iconRight={<Glyph size={14}>→</Glyph>}>
              {ownedLabel}
            </Button>
          </>
        ) : (
          <>
            {PLANS_ENABLED && monthlyPlan ? (
              <>
                <LinkButton href={subscribeHref(locale)} fullWidth>
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
                <LinkButton href={courseLandingHref(locale, course)} fullWidth>
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
