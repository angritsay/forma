import type { CSSProperties, ReactNode } from 'react';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDuration, formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { ArtButton } from './ArtButton';
import type { TodayModel } from './useTodayModel';

export interface TodayCardProps {
  model: TodayModel;
  onStart: (courseId: string, nodeId: string) => void;
  onOpenPath: (courseId: string) => void;
  onLogSteps: () => void;
  onPickCourse: () => void;
}

function Frame({
  gradient,
  eyebrow,
  title,
  subtitle,
  figure,
  children,
}: {
  gradient?: [string, string];
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  figure?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card gradient={gradient ?? true} padding="md" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">
            {eyebrow}
          </span>
          <h2 className="font-display mt-1 text-[28px] text-balance">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-medium opacity-80">{subtitle}</p> : null}
        </div>
        {figure ? <div className="w-28 shrink-0">{figure}</div> : null}
      </div>
      {children}
    </Card>
  );
}

/** The "Today" hero tile: next node of the active course, or a nudge to pick a course. */
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
        <Frame
          eyebrow={eyebrow}
          title={t('app.homeTodayNoCourseTitle')}
          subtitle={t('app.homeTodayNoCourseBody')}
        >
          <ArtButton fullWidth onClick={onPickCourse} icon={<Icon name="courses" size={18} />}>
            {t('app.homeTodayNoCourseCta')}
          </ArtButton>
        </Frame>
      );

    case 'completed':
      return (
        <Frame
          gradient={model.course.gradient}
          eyebrow={l(model.course.name)}
          title={t('app.homeTodayCompletedTitle')}
          subtitle={t('app.homeTodayCompletedBody')}
          figure={
            <span className="flex size-28 items-center justify-center rounded-inner bg-black/10">
              <Icon name="trophy" size={40} />
            </span>
          }
        >
          <ArtButton fullWidth onClick={() => onOpenPath(model.course.id)}>
            {t('app.homeTodayOpenPath')}
          </ArtButton>
        </Frame>
      );

    case 'rest': {
      const pct = model.goal > 0 ? Math.min(1, model.stepsToday / model.goal) : 0;
      return (
        <Frame
          gradient={model.course.gradient}
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: model.node.week, day: model.node.day })}`}
          title={l(model.node.title)}
          subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          figure={
            <span className="flex size-28 items-center justify-center rounded-inner bg-black/10">
              <Icon name="steps" size={44} />
            </span>
          }
        >
          <div className="flex flex-col gap-2">
            <ProgressBar
              value={pct}
              tone="primary"
              label={t('app.homeStatsSteps')}
              valueText={`${Math.round(pct * 100)}%`}
            />
            <span className="tabular text-sm font-medium opacity-80">
              {t('app.homeTodayStepsProgress', {
                steps: formatNumber(locale, model.stepsToday),
                goal: formatNumber(locale, model.goal),
              })}
            </span>
          </div>
          <ArtButton fullWidth onClick={onLogSteps} icon={<Icon name="steps" size={18} />}>
            {t('app.homeTodayLogSteps')}
          </ArtButton>
        </Frame>
      );
    }

    case 'milestone':
      return (
        <Frame
          gradient={model.course.gradient}
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: model.node.week, day: model.node.day })}`}
          title={l(model.node.title)}
          subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          figure={
            <span className="flex size-28 items-center justify-center rounded-inner bg-black/10">
              <Icon name="star" size={40} />
            </span>
          }
        >
          <ArtButton fullWidth onClick={() => onOpenPath(model.course.id)}>
            {t('app.homeTodayOpen')}
          </ArtButton>
        </Frame>
      );

    case 'workout': {
      const { course, node, workout, exercise } = model;
      const subtitle = node.subtitle ? l(node.subtitle) : l(workout.focus);
      const style = {
        '--course-g1': course.gradient[0],
        '--course-g2': course.gradient[1],
      } as CSSProperties;
      return (
        <Frame
          gradient={course.gradient}
          eyebrow={`${eyebrow} · ${t('app.homeTodayWeek', { week: node.week, day: node.day })}`}
          title={l(node.title)}
          subtitle={subtitle}
          figure={
            <div className="overflow-hidden rounded-inner" style={style}>
              <ExerciseFigure
                animation={exercise?.animation ?? 'air_squat'}
                variant="hero"
                gradient={course.gradient}
                label={exercise ? l(exercise.name) : undefined}
              />
            </div>
          }
        >
          <div className="flex flex-wrap gap-2">
            {node.kind === 'test' ? (
              <Badge tone="on-art" icon="trophy" size="md">
                {t('app.nodeTestBadge')}
              </Badge>
            ) : null}
            {node.kind === 'benchmark' ? (
              <Badge tone="on-art" icon="trophy" size="md">
                {t('app.nodeBenchmarkBadge')}
              </Badge>
            ) : null}
            {model.durationSec !== null ? (
              <Chip tone="on-art" size="sm" icon="clock">
                {formatDuration(locale, model.durationSec)}
              </Chip>
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
          </div>
          <ArtButton
            fullWidth
            onClick={() => onStart(course.id, node.id)}
            icon={<Icon name="play" size={18} />}
          >
            {t('app.homeTodayStart')}
          </ArtButton>
        </Frame>
      );
    }
  }
}
