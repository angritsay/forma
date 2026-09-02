/**
 * Course path (docs/SPEC.md §10 flow 4): progress ring, load scale badge, leaderboard link and
 * the Duolingo-style path grouped by week. Rest days and milestones open a sheet; workout
 * nodes go to the preview.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { RingProgress } from '@/components/ui/RingProgress';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { COURSE_BY_ID } from '@/content/registry';
import type { CourseNode } from '@/content/schema';
import { formatNumber } from '@/i18n/index';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { courseLandingHref } from '@/app/features/courses/courseMeta';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { NodeSheet } from '@/app/features/path/NodeSheet';
import { courseProgress, nodeStatus, type NodeStatus } from '@/app/features/path/nodeState';
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

export default function CoursePathScreen() {
  useProgressLoader();
  const { id = '' } = useParams();
  const { t, l, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const course = COURSE_BY_ID.get(id);
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
          icon="warning"
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
          icon="lock"
          title={t('app.pathNotOwnedTitle')}
          description={t('app.pathNotOwnedBody')}
          action={
            <LinkButton href={courseLandingHref(locale, course)}>
              {t('app.pathNotOwnedCta')}
            </LinkButton>
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

  const header = (
    <TopBar
      back="/courses"
      title={l(course.name)}
      right={
        <IconButton
          label={t('app.pathLeaderboard')}
          icon="trophy"
          variant="ghost"
          onClick={() => navigate(`/leaderboard?course=${course.id}`)}
        />
      }
    />
  );

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = (
      <div className="flex flex-col items-center gap-6 py-6" aria-hidden="true">
        <Skeleton rounded="pill" className="size-[72px]" />
        <Skeleton rounded="pill" className="size-[72px] translate-x-16" />
        <Skeleton rounded="pill" className="size-[72px]" />
        <Skeleton rounded="pill" className="size-[72px] -translate-x-16" />
      </div>
    );
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
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
    <Screen header={header}>
      <div className="flex items-center gap-4 py-3">
        <RingProgress
          value={progress.pct / 100}
          size={56}
          stroke={6}
          tone="accent"
          label={t('app.pathProgressLabel')}
          valueText={`${progress.pct}%`}
        >
          <span className="tabular text-xs font-bold">{progress.pct}%</span>
        </RingProgress>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{t('app.pathProgressLabel')}</p>
          <p className="tabular text-[15px] font-semibold">
            {t('app.pathProgress', { done: progress.done, total: progress.total })}
          </p>
        </div>
        <Chip tone="accent" size="sm" icon="bolt" onClick={() => setScaleOpen(true)}>
          {t('app.pathScaleBadge', { scale: formatNumber(locale, scale, 2) })}
        </Chip>
      </div>
      {finished ? (
        <div className="pb-2">
          <Badge tone="success" icon="trophy" size="md">
            {t('app.pathCompleted')}
          </Badge>
        </div>
      ) : null}
      {body}
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
  );
}
