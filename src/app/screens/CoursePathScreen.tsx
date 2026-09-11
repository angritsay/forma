/**
 * Course path (docs/SPEC.md §10 flow 4): a header in the programme colour, the week strip, the
 * three numbers that say where you are, and the days as a ruled list grouped by week. Rest days
 * and milestones open a sheet; workout nodes go to the preview.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { findCourse } from '@/content/catalogue';
import type { Course, CourseNode } from '@/content/schema';
import { formatNumber } from '@/i18n/index';
import { courseTileVars } from '@/lib/ui/tile';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import {
  courseLandingHref,
  perWeekLabel,
  subscribeHref,
  weeksLabel,
} from '@/app/features/courses/courseMeta';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { PLANS_ENABLED } from '@content/site/plans';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { NodeSheet } from '@/app/features/path/NodeSheet';
import {
  courseProgress,
  groupNodesByWeek,
  nodeStatus,
  type NodeStatus,
  type PathState,
} from '@/app/features/path/nodeState';
import { PathView } from '@/app/features/path/PathView';
import { ScaleSheet } from '@/app/features/path/ScaleSheet';
import {
  startingScale,
  useCourseStateRow,
  useProgress,
  useProgressLoader,
  useStepsToday,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

/**
 * The weeks as a strip of 2px rules, the way the design system's course screen draws them: a
 * finished week is ruled in full ink and ticked, the week in progress is ruled in full ink, the
 * weeks ahead are ruled faintly. Numbers rather than the word "week" so eight weeks still fit on
 * a 390px screen; the accessible name spells it out.
 */
function WeekStrip({ course, state }: { course: Course; state: PathState | null | undefined }) {
  const { t } = useT();
  const groups = groupNodesByWeek(course);
  const currentIndex = course.nodes.findIndex(
    (_, i) => nodeStatus(i, course.nodes, state) === 'current',
  );
  const currentWeek = currentIndex >= 0 ? course.nodes[currentIndex]?.week : undefined;
  return (
    <ol className="flex gap-2.5" aria-label={t('app.pathStatDays')}>
      {groups.map((g) => {
        const done = g.nodes.every(
          ({ index }) => nodeStatus(index, course.nodes, state) === 'done',
        );
        const active = g.week === currentWeek;
        const on = done || active;
        return (
          <li
            key={g.week}
            aria-label={`${t('app.pathWeek', { n: g.week })}${done ? ` — ${t('app.pathNodeDone')}` : ''}`}
            aria-current={active ? 'step' : undefined}
            className={clsx(
              'flex flex-1 items-baseline gap-1.5 border-t-2 pt-2',
              on ? 'border-current' : 'border-current/25',
            )}
          >
            <span className={clsx('numeral text-xs', on ? 'text-current' : 'opacity-45')}>
              {String(g.week).padStart(2, '0')}
            </span>
            {done ? (
              <Glyph size={11} className="text-current">
                ✓
              </Glyph>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default function CoursePathScreen() {
  useProgressLoader();
  const { id = '' } = useParams();
  const tr = useT();
  const { t, l, locale } = tr;
  const navigate = useNavigate();
  const toast = useToast();
  const course = findCourse(id);
  const entitlements = useSession((s) => s.entitlements);
  const profile = useSession((s) => s.profile);
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const setActiveCourse = useProgress((s) => s.setActiveCourse);
  const row = useCourseStateRow(course?.id);
  const stepsToday = useStepsToday();
  const [sheetNode, setSheetNode] = useState<CourseNode | null>(null);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const owned = course ? entitlements.includes(course.id) : false;

  // The course the athlete opened becomes the one the Home screen follows.
  useEffect(() => {
    if (course && owned) setActiveCourse(course.id);
  }, [course, owned, setActiveCourse]);

  if (!course) {
    return (
      <Screen header={<TopBar back="/courses" />}>
        <EmptyState
          title={t('app.pathNotFound')}
          action={<Button onClick={() => navigate('/courses')}>{t('app.tabCourses')}</Button>}
        />
      </Screen>
    );
  }

  if (!owned) {
    return (
      <Screen header={<TopBar back="/courses" title={l(course.name)} />}>
        <EmptyState
          title={t('app.pathNotOwnedTitle')}
          description={t('app.pathNotOwnedBody')}
          action={
            <div className="flex flex-col gap-2">
              {PLANS_ENABLED ? (
                <LinkButton href={subscribeHref(locale)}>{t('app.coursesSubscribe')}</LinkButton>
              ) : null}
              <LinkButton
                href={courseLandingHref(locale, course)}
                variant={PLANS_ENABLED ? 'secondary' : 'primary'}
              >
                {t('app.pathNotOwnedCta')}
              </LinkButton>
            </div>
          }
        />
      </Screen>
    );
  }

  const progress = courseProgress(course.nodes, row);
  const finished = progress.total > 0 && progress.done >= progress.total;
  const scale = row?.scale ?? startingScale(profile);
  const sheetIndex = sheetNode ? course.nodes.findIndex((n) => n.id === sheetNode.id) : -1;
  const sheetStatus: NodeStatus =
    sheetIndex >= 0 ? nodeStatus(sheetIndex, course.nodes, row) : 'locked';

  const onNodePress = (node: CourseNode, _index: number, nodeState: NodeStatus) => {
    if (nodeState === 'locked') {
      toast.show({ kind: 'info', title: t('app.pathLockedToast') });
      return;
    }
    if (node.kind === 'rest' || node.kind === 'milestone') {
      setSheetNode(node);
      return;
    }
    navigate(`/courses/${course.id}/nodes/${node.id}`);
  };

  const completeSheetNode = async (skip: boolean) => {
    if (!sheetNode) return;
    setBusy(true);
    try {
      await useProgress.getState().completeNode(course.id, sheetNode.id);
      const title =
        sheetNode.kind === 'rest'
          ? skip
            ? t('app.pathRestSkipped')
            : t('app.pathRestCompleted')
          : t('app.pathMilestoneDone');
      toast.show({ kind: 'success', title });
      setSheetNode(null);
    } catch {
      toast.show({ kind: 'error', title: t('app.pathSaveError') });
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = (
      <div className="flex flex-col gap-3 py-2" aria-hidden="true">
        <Skeleton rounded="control" className="h-3 w-24" />
        <Skeleton rounded="control" className="h-14" />
        <Skeleton rounded="control" className="h-14" />
        <Skeleton rounded="control" className="h-14" />
        <Skeleton rounded="control" className="h-14" />
      </div>
    );
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.homeErrorTitle')}
        description={t('app.homeErrorBody')}
        action={
          <Button size="lg" loading={loading} onClick={() => void useProgress.getState().refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    body = <PathView course={course} state={row} onNodePress={onNodePress} />;
  }

  return (
    /*
     * `--course-tile` is set once, around the whole screen: the header is painted in it, and
     * further down the current day's number, the ticks and its rule read the same variable. One
     * screen, one colour — and this is the screen it belongs to.
     */
    <div style={courseTileVars(course.tile)}>
      <Screen>
        {/*
         * The header block is the programme colour with ink text, bleeding past the gutters and up
         * under the status bar: the course's name as the one big line, its tagline light under it,
         * the specification as a kicker, then the weeks as a strip of rules. There is no bar; the
         * back control is a kicker in the block's top-left corner and the leaderboard sits opposite.
         */}
        <header className="hero-art -mx-5 -mt-[var(--safe-top)] px-5 pt-[calc(var(--safe-top)+14px)] pb-6 lg:-mx-8 lg:px-8">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              aria-label={t('common.back')}
              className="eyebrow tap-target-y inline-flex items-center gap-1.5 text-current"
            >
              <Glyph size={12}>←</Glyph>
              {t('app.tabCourses')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/leaderboard?course=${course.id}`)}
              className="eyebrow tap-target-y inline-flex items-center gap-1.5 text-current opacity-70"
            >
              {t('app.pathLeaderboard')}
              <Glyph size={12}>›</Glyph>
            </button>
          </div>
          <div className="mt-8">
            <DisplayTitle text={l(course.name)} className="text-6xl lg:text-7xl" />
            {/*
             * The tagline is set to be read, not looked at: Onest, sentence case.
             *
             * It was `.display t-thin`, which forces capitals — and a tagline is a sentence, not a
             * label. «ЧЕТЫРЕ НЕДЕЛИ ПО ПРОГРАММЕ ТРЕНЕРА ДЛЯ НОВИЧКОВ: КОРОТКО, ПО КРУГУ, БЕЗ
             * ОБОРУДОВАНИЯ.» ran four lines of Cyrillic capitals under the title, where the word
             * shapes are near-identical rectangles and nothing can be skimmed. The brandbook puts
             * capitals on kickers and on the one big line; the thin weight is the device for
             * *that* line, not a way to set running copy.
             */}
            <p className="mt-2 max-w-[34ch] text-base leading-snug opacity-80">
              {l(course.tagline)}
            </p>
            <p className="eyebrow mt-4 text-current opacity-60">
              {weeksLabel(tr, course.weeks)} · {perWeekLabel(tr, course.sessionsPerWeek)}
            </p>
          </div>
          <div className="mt-7">
            <WeekStrip course={course} state={row} />
          </div>
        </header>
        {/*
         * Where you are, in three figures on one ruled line. The third is a button: the load
         * multiplier opens the sheet that explains how the course adapts.
         */}
        <div className="-mx-5 grid grid-cols-3 divide-x divide-border border-b border-border bg-bg lg:-mx-8">
          <div className="px-5 py-4 lg:px-8">
            <div className="numeral tabular text-2xl leading-none">{progress.pct}%</div>
            <div className="eyebrow mt-2">{t('app.pathStatDone')}</div>
          </div>
          <div className="px-4 py-4">
            <div className="numeral tabular text-2xl leading-none">
              {String(progress.done).padStart(2, '0')}/{String(progress.total).padStart(2, '0')}
            </div>
            <div className="eyebrow mt-2">{t('app.pathStatDays')}</div>
          </div>
          <button
            type="button"
            onClick={() => setScaleOpen(true)}
            className="px-4 py-4 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface"
            aria-label={t('app.pathScaleBadge', { scale: formatNumber(locale, scale, 2) })}
          >
            <div className="numeral tabular text-2xl leading-none">
              ×{formatNumber(locale, scale, 2)}
            </div>
            <div className="eyebrow mt-2 flex items-center gap-1">
              {t('app.pathStatLoad')}
              <Glyph size={11}>›</Glyph>
            </div>
          </button>
        </div>
        {finished ? (
          <div className="pt-5">
            <Badge tone="success" size="md">
              {t('app.pathCompleted')}
            </Badge>
          </div>
        ) : null}
        <div className="pt-6">{body}</div>
        <NodeSheet
          node={sheetNode}
          status={sheetStatus}
          stepsToday={stepsToday}
          busy={busy}
          onClose={() => setSheetNode(null)}
          onLogSteps={() => navigate('/steps')}
          onComplete={(skip) => void completeSheetNode(skip)}
        />
        <ScaleSheet open={scaleOpen} scale={scale} onClose={() => setScaleOpen(false)} />
      </Screen>
    </div>
  );
}
