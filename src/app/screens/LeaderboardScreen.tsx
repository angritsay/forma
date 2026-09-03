/**
 * Leaderboard (docs/SPEC.md §10 flow 9): week / all-time tabs, a course filter (global + owned
 * courses, `?course=<id>` in the hash route) and the top 100 with the athlete's own row pinned
 * at the bottom when it falls outside the list.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { COURSES } from '@/content/registry';
import type { LeaderboardPeriod } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { LeaderboardList, LeaderboardRowView } from '@/app/features/leaderboard/LeaderboardList';
import { resolveCourseParam, splitLeaderboard } from '@/app/features/leaderboard/model';
import { PointsSheet } from '@/app/features/leaderboard/PointsSheet';
import { useLeaderboard } from '@/app/features/leaderboard/useLeaderboard';
import { useSession } from '@/app/store/session';

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}

export default function LeaderboardScreen() {
  const { t, l } = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const entitlements = useSession((s) => s.entitlements);
  const courseId = resolveCourseParam(searchParams.get('course'), entitlements);
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [infoOpen, setInfoOpen] = useState(false);
  const { rows, status, error, reload } = useLeaderboard(period, courseId);
  const view = useMemo(() => splitLeaderboard(rows), [rows]);
  const ownedCourses = COURSES.filter((c) => entitlements.includes(c.id));

  const selectCourse = (id: string | null) => {
    setSearchParams(id ? { course: id } : {}, { replace: true });
  };

  const header = (
    <TopBar
      back
      title={t('app.leaderboardTitle')}
      right={
        <>
          <IconButton
            label={t('app.leaderboardRefresh')}
            icon={status === 'loading' ? <Spinner size={18} /> : 'refresh'}
            variant="ghost"
            disabled={status === 'loading'}
            onClick={reload}
          />
          <IconButton
            label={t('app.leaderboardHowTitle')}
            icon="info"
            variant="ghost"
            onClick={() => setInfoOpen(true)}
          />
        </>
      }
    />
  );

  let body: React.ReactNode;
  if (status === 'loading') {
    body = <ListSkeleton />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
        title={t('app.leaderboardErrorTitle')}
        description={
          error?.code === 'network' ? t('common.errorOffline') : t('common.errorGeneric')
        }
        action={
          <Button size="lg" onClick={reload}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else if (view.empty) {
    body = (
      <EmptyState
        icon="trophy"
        title={t('app.leaderboardEmptyTitle')}
        description={
          period === 'week' ? t('app.leaderboardEmptyWeek') : t('app.leaderboardEmptyAll')
        }
      />
    );
  } else {
    body = <LeaderboardList rows={view.top} />;
  }

  return (
    <Screen
      header={header}
      footer={
        status === 'ready' && view.pinned && view.me ? (
          <LeaderboardRowView row={view.me} pinned />
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <Tabs<LeaderboardPeriod>
          variant="pills"
          label={t('app.leaderboardTitle')}
          value={period}
          onChange={setPeriod}
          tabs={[
            { id: 'week', label: t('app.leaderboardTabWeek') },
            { id: 'all', label: t('app.leaderboardTabAll') },
          ]}
        />
        <div
          role="radiogroup"
          aria-label={t('app.leaderboardFilterLabel')}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
        >
          <Chip
            role="radio"
            aria-checked={courseId === null}
            selected={courseId === null}
            icon="globe"
            onClick={() => selectCourse(null)}
          >
            {t('app.leaderboardGlobal')}
          </Chip>
          {ownedCourses.map((course) => (
            <Chip
              key={course.id}
              role="radio"
              aria-checked={courseId === course.id}
              selected={courseId === course.id}
              onClick={() => selectCourse(course.id)}
            >
              {l(course.name)}
            </Chip>
          ))}
        </div>
        <div role="tabpanel" id={tabPanelId(period)} aria-labelledby={`tab-${period}`}>
          {body}
        </div>
      </div>
      <PointsSheet open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Screen>
  );
}
