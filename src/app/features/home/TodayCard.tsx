import type { CSSProperties, ReactNode } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PhotoBlock } from '@/components/ui/PhotoBlock';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDuration, formatNumber } from '@/i18n/index';
import { PHOTOS } from '@/lib/media/photos';
import { useT } from '@/app/hooks/useT';
import type { TodayModel } from './useTodayModel';

export interface TodayCardProps {
  model: TodayModel;
  onStart: (courseId: string, nodeId: string) => void;
  onOpenPath: (courseId: string) => void;
  onLogSteps: () => void;
  onPickCourse: () => void;
}

/**
 * The photo-led frame: today's session as a full-bleed photograph with the title across it.
 *
 * This is the block the home screen is built around, and the clearest break from the old design.
 * Where a pastel gradient card carried a small heading and a drawn figure, there is now a
 * picture of a person training, running past both page gutters, with the session name in white
 * over its bottom third. Everything else on the screen is set quietly so this can carry it.
 */
function PhotoFrame({
  eyebrow,
  title,
  subtitle,
  stamp,
  edgeLabel,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  stamp?: ReactNode;
  edgeLabel?: ReactNode;
  children?: ReactNode;
}) {
  return (
    /*
     * `-mr-5` only. The photograph bleeds off the right edge of the phone and stays on the text
     * column's left margin — the asymmetry is the point, and it leaves the gutter the vertical
     * course label needs.
     */
    <section className="-mr-5">
      <PhotoBlock
        photo={PHOTOS.homeToday}
        alt=""
        ratio="portrait"
        priority
        stamp={stamp}
        edgeLabel={edgeLabel}
      >
        <span className="eyebrow text-accent">{eyebrow}</span>
        <h2 className="font-display mt-2 text-3xl text-balance text-white">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-sm text-white/80">{subtitle}</p> : null}
        {children ? <div className="mt-4 flex flex-col gap-3">{children}</div> : null}
      </PhotoBlock>
    </section>
  );
}

/**
 * The figure-led frame: used where there is no session to photograph — a rest day, a finished
 * course, no course at all. A flat course tile with the pictogram, under a hairline heading.
 */
function TileFrame({
  eyebrow,
  title,
  subtitle,
  tile,
  figure,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  tile?: string;
  figure?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-t border-border pt-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="font-display mt-2 text-2xl text-balance">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {figure ? (
          <div
            className="hero-art flex size-24 shrink-0 items-center justify-center rounded-tile"
            style={tile ? ({ '--course-tile': tile } as CSSProperties) : undefined}
          >
            {figure}
          </div>
        ) : null}
      </div>
      {children ? <div className="mt-5 flex flex-col gap-3">{children}</div> : null}
    </section>
  );
}

/** The "Today" hero block: next node of the active course, or a nudge to pick a course. */
export function TodayCard({
  model,
  onStart,
  onOpenPath,
  onLogSteps,
  onPickCourse,
}: TodayCardProps) {
  const { t, l, locale } = useT();
  const eyebrow = t('app.homeTodayEyebrow');

  switch (model.kind) {
    case 'none':
      return (
        <TileFrame
          eyebrow={eyebrow}
          title={t('app.homeTodayNoCourseTitle')}
          subtitle={t('app.homeTodayNoCourseBody')}
        >
          <Button
            fullWidth
            size="lg"
            onClick={onPickCourse}
            icon={<Icon name="courses" size={16} />}
          >
            {t('app.homeTodayNoCourseCta')}
          </Button>
        </TileFrame>
      );

    case 'completed':
      return (
        <TileFrame
          eyebrow={l(model.course.name)}
          title={t('app.homeTodayCompletedTitle')}
          subtitle={t('app.homeTodayCompletedBody')}
          tile={model.course.tile}
          figure={<Icon name="trophy" size={36} />}
        >
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            onClick={() => onOpenPath(model.course.id)}
          >
            {t('app.homeTodayOpenPath')}
          </Button>
        </TileFrame>
      );

    case 'rest': {
      const pct = model.goal > 0 ? Math.min(1, model.stepsToday / model.goal) : 0;
      return (
        <TileFrame
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: model.node.week, day: model.node.day })}`}
          title={l(model.node.title)}
          subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          tile={model.course.tile}
          figure={<Icon name="steps" size={40} />}
        >
          <div className="flex flex-col gap-2">
            <ProgressBar
              value={pct}
              tone="accent"
              label={t('app.homeStatsSteps')}
              valueText={`${Math.round(pct * 100)}%`}
            />
            <span className="tabular text-sm text-muted">
              {t('app.homeTodayStepsProgress', {
                steps: formatNumber(locale, model.stepsToday),
                goal: formatNumber(locale, model.goal),
              })}
            </span>
          </div>
          <Button fullWidth size="lg" onClick={onLogSteps} icon={<Icon name="steps" size={16} />}>
            {t('app.homeTodayLogSteps')}
          </Button>
        </TileFrame>
      );
    }

    case 'milestone':
      return (
        <TileFrame
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: model.node.week, day: model.node.day })}`}
          title={l(model.node.title)}
          subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          tile={model.course.tile}
          figure={<Icon name="star" size={36} />}
        >
          <Button fullWidth size="lg" onClick={() => onOpenPath(model.course.id)}>
            {t('app.homeTodayOpen')}
          </Button>
        </TileFrame>
      );

    case 'workout': {
      const { course, node, workout, exercise } = model;
      const subtitle = node.subtitle ? l(node.subtitle) : l(workout.focus);
      return (
        <PhotoFrame
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: node.week, day: node.day })}`}
          title={l(node.title)}
          subtitle={subtitle}
          edgeLabel={l(course.name)}
          stamp={model.durationSec !== null ? formatDuration(locale, model.durationSec) : undefined}
        >
          <div className="flex flex-wrap items-center gap-2">
            {node.kind === 'test' ? (
              <Badge tone="on-art" icon="trophy">
                {t('app.nodeTestBadge')}
              </Badge>
            ) : null}
            {node.kind === 'benchmark' ? (
              <Badge tone="on-art" icon="trophy">
                {t('app.nodeBenchmarkBadge')}
              </Badge>
            ) : null}
            {model.points !== null ? (
              <Chip tone="on-art" size="sm" icon="bolt">
                {t('app.nodePoints', { n: model.points })}
              </Chip>
            ) : null}
            {node.deload ? (
              <Chip tone="on-art" size="sm">
                {t('training.deloadBadge')}
              </Chip>
            ) : null}
            {model.repeat ? (
              <Chip tone="on-art" size="sm" icon="refresh">
                {t('training.repeatPoints')}
              </Chip>
            ) : null}
            {/*
             * The pictogram rides in the corner of the photograph instead of taking a column of
             * its own: the picture is the art here, and the figure is a legend for it.
             */}
            <span className="ml-auto shrink-0">
              <ExerciseFigure
                animation={exercise?.animation ?? 'air_squat'}
                variant="thumb"
                className="size-12 text-white/85"
                label={exercise ? l(exercise.name) : undefined}
              />
            </span>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => onStart(course.id, node.id)}
            icon={<Icon name="play" size={16} />}
          >
            {t('app.homeTodayStart')}
          </Button>
        </PhotoFrame>
      );
    }
  }
}
