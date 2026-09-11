import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Course, CourseNode, Workout } from '@/content/schema';
import { formatDuration, formatNumber } from '@/i18n/index';
import { PHOTOS, photoSrc } from '@/lib/media/photos';
import { useT } from '@/app/hooks/useT';
import { DisplayTitle } from './DisplayTitle';
import type { TodayModel } from './useTodayModel';

export interface TodayCardProps {
  model: TodayModel;
  /** Kicker set above the headline — the greeting. */
  eyebrow?: ReactNode;
  /** Controls laid over the top-right corner of the photograph (refresh, profile). */
  chrome?: ReactNode;
  onStart: (courseId: string, nodeId: string) => void;
  onOpenPath: (courseId: string) => void;
  onLogSteps: () => void;
  onPickCourse: () => void;
}

/** How many of the coming days the home screen lists under today's session. */
const UP_NEXT_COUNT = 3;

/**
 * The photograph the home screen opens on: full-bleed, monochrome, grained, running up under the
 * status bar. The wordmark sits in its top-left corner and the app's controls in the top-right,
 * the one big line of the screen stands in its bottom third, and one gradient protects both — dark
 * at the top for the chrome, near-black at the bottom so the headline and the button under it read
 * as one block.
 *
 * Built by hand rather than with <PhotoBlock>: that frame is a column-width picture with a caption
 * under a bottom scrim, and this one is the screen itself.
 */
function PhotoHero({
  kicker,
  chrome,
  eyebrow,
  title,
  meta,
  subtitle,
}: {
  /** Top-right kicker: where you are in the course. */
  kicker?: ReactNode;
  chrome?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
  /** Kicker under the headline: today's facts in capitals. */
  meta?: ReactNode;
  /** One quiet line of running text under the kicker. */
  subtitle?: ReactNode;
}) {
  const photo = PHOTOS.homeToday;
  return (
    /*
     * Bleeds past both gutters and up under the safe area, so the picture is the screen and not a
     * card on it. `-mx-5 lg:-mx-8` undoes <Screen>'s padding at both breakpoints.
     */
    <section className="relative -mx-5 -mt-[var(--safe-top)] flex h-[52dvh] max-h-[640px] min-h-[420px] flex-col justify-between overflow-hidden lg:-mx-8">
      <img
        src={photoSrc(photo)}
        alt=""
        width={photo.width}
        height={photo.height}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="photo-mono absolute inset-0 size-full object-cover"
      />
      <div className="photo-grain" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,17,0.55),transparent_35%,rgba(15,15,17,0.94))]"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-5 pt-[calc(var(--safe-top)+14px)] text-paper lg:px-8">
        <Logo className="text-[15px]" />
        <span className="min-w-0 flex-1" />
        {kicker ? <span className="eyebrow truncate text-paper/70">{kicker}</span> : null}
        {chrome}
      </div>
      <div className="relative px-5 pb-6 text-paper lg:px-8">
        {eyebrow ? <span className="eyebrow block truncate text-paper/70">{eyebrow}</span> : null}
        <DisplayTitle text={title} className="mt-2 text-6xl lg:text-7xl" />
        {meta ? <span className="eyebrow mt-3.5 block text-paper">{meta}</span> : null}
        {subtitle ? <p className="mt-1.5 text-[13px] text-paper/75">{subtitle}</p> : null}
      </div>
    </section>
  );
}

/** Three facts about today's session on one ruled line: the day, the exercises, the minutes. */
function TodayFacts({ facts }: { facts: readonly { value: ReactNode; label: ReactNode }[] }) {
  return (
    <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
      {facts.map((f, i) => (
        <div key={i} className="flex flex-col gap-1">
          <dd className="numeral tabular order-1 text-3xl leading-none">{f.value}</dd>
          <dt className="eyebrow order-2 mt-1">{f.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/**
 * The days after today, as ruled rows: the name on the left, the day number as a kicker on the
 * right. Every row opens the course path — this is an index, not a launcher, and the path is
 * where a future day is actually looked at.
 */
function UpNext({
  course,
  current,
  onOpenPath,
}: {
  course: Course;
  current: CourseNode;
  onOpenPath: (courseId: string) => void;
}) {
  const { t, l } = useT();
  const start = course.nodes.findIndex((n) => n.id === current.id);
  if (start < 0) return null;
  const coming = course.nodes.slice(start + 1, start + 1 + UP_NEXT_COUNT);
  if (coming.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="eyebrow">{t('app.homeUpNext')}</h2>
      <ul className="mt-1">
        {coming.map((node, i) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onOpenPath(course.id)}
              className="flex w-full items-baseline justify-between gap-4 border-b border-border py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface"
            >
              <span className="min-w-0 truncate text-[15px] font-semibold">{l(node.title)}</span>
              <span className="eyebrow shrink-0">
                {t('app.homeUpNextDay', { n: start + 2 + i })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Items in the workout proper — the warm-up and cool-down are not what the day is about. */
function exerciseCount(workout: Workout): number {
  const main = workout.blocks.filter((b) => b.type !== 'warmup' && b.type !== 'cooldown');
  const blocks = main.length > 0 ? main : workout.blocks;
  return blocks.reduce((n, b) => n + b.items.length, 0);
}

/** "12′" — minutes with a prime, the brand's way of writing a duration as a figure. */
function minutesGlyph(sec: number | null): string {
  if (sec === null) return '—';
  return `${Math.max(1, Math.round(sec / 60))}′`;
}

/** The "Today" hero block: next node of the active course, or a nudge to pick a course. */
export function TodayCard({
  model,
  eyebrow,
  chrome,
  onStart,
  onOpenPath,
  onLogSteps,
  onPickCourse,
}: TodayCardProps) {
  const { t, l, locale } = useT();
  const today = t('app.homeTodayEyebrow');
  const whereKicker = (node: CourseNode) =>
    t('app.homeTodayWeek', { week: node.week, day: node.day });

  switch (model.kind) {
    case 'none':
      return (
        <div>
          <PhotoHero
            chrome={chrome}
            eyebrow={eyebrow}
            title={t('app.homeTodayNoCourseTitle')}
            subtitle={t('app.homeTodayNoCourseBody')}
          />
          <Button fullWidth size="lg" className="mt-5" onClick={onPickCourse}>
            {t('app.homeTodayNoCourseCta')}
          </Button>
        </div>
      );

    case 'completed':
      return (
        <div>
          <PhotoHero
            chrome={chrome}
            eyebrow={eyebrow}
            kicker={l(model.course.name)}
            title={t('app.homeTodayCompletedTitle')}
            subtitle={t('app.homeTodayCompletedBody')}
          />
          <Button
            fullWidth
            size="lg"
            variant="secondary"
            className="mt-5"
            onClick={() => onOpenPath(model.course.id)}
          >
            {t('app.homeTodayOpenPath')}
          </Button>
        </div>
      );

    case 'rest': {
      const pct = model.goal > 0 ? Math.min(1, model.stepsToday / model.goal) : 0;
      return (
        <div>
          <PhotoHero
            chrome={chrome}
            eyebrow={eyebrow}
            kicker={whereKicker(model.node)}
            title={l(model.node.title)}
            meta={today}
            subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          />
          {/*
           * The bar stays white here: the home screen keeps the programme colour for the course
           * rows further down, and a rest day is the athlete's own goal, not the course's.
           */}
          <div className="mt-5 flex flex-col gap-2">
            <ProgressBar
              value={pct}
              tone="primary"
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
          <Button fullWidth size="lg" className="mt-4" onClick={onLogSteps}>
            {t('app.homeTodayLogSteps')}
          </Button>
          <UpNext course={model.course} current={model.node} onOpenPath={onOpenPath} />
        </div>
      );
    }

    case 'milestone':
      return (
        <div>
          <PhotoHero
            chrome={chrome}
            eyebrow={eyebrow}
            kicker={whereKicker(model.node)}
            title={l(model.node.title)}
            meta={today}
            subtitle={model.node.subtitle ? l(model.node.subtitle) : undefined}
          />
          <Button fullWidth size="lg" className="mt-5" onClick={() => onOpenPath(model.course.id)}>
            {t('app.homeTodayOpen')}
          </Button>
          <UpNext course={model.course} current={model.node} onOpenPath={onOpenPath} />
        </div>
      );

    case 'workout': {
      const { course, node, workout } = model;
      const subtitle = node.subtitle ? l(node.subtitle) : l(workout.focus);
      const dayIndex = course.nodes.findIndex((n) => n.id === node.id) + 1;
      const metaParts = [today];
      if (model.durationSec !== null) metaParts.push(formatDuration(locale, model.durationSec));
      if (model.points !== null) metaParts.push(t('app.nodePoints', { n: model.points }));
      if (node.kind === 'test') metaParts.push(t('app.nodeTestBadge'));
      if (node.kind === 'benchmark') metaParts.push(t('app.nodeBenchmarkBadge'));
      if (node.deload) metaParts.push(t('training.deloadBadge'));
      if (model.repeat) metaParts.push(t('training.repeatPoints'));
      return (
        <div>
          <PhotoHero
            chrome={chrome}
            eyebrow={eyebrow}
            kicker={whereKicker(node)}
            title={l(node.title)}
            meta={metaParts.join(' · ')}
            subtitle={subtitle}
          />
          <Button
            fullWidth
            size="lg"
            className="mt-5"
            onClick={() => onStart(course.id, node.id)}
            iconRight={<Glyph size={14}>→</Glyph>}
          >
            {t('app.homeTodayStart')}
          </Button>
          <TodayFacts
            facts={[
              {
                value: String(dayIndex).padStart(2, '0'),
                label: t('app.homeTodayStatDay', { total: course.nodes.length }),
              },
              {
                value: String(exerciseCount(workout)).padStart(2, '0'),
                label: t('app.homeTodayStatExercises'),
              },
              { value: minutesGlyph(model.durationSec), label: t('app.homeTodayStatTime') },
            ]}
          />
          <UpNext course={course} current={node} onOpenPath={onOpenPath} />
        </div>
      );
    }
  }
}
