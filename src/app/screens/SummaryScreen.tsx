/**
 * Session summary + feedback (docs/SPEC.md §10 flow 7) at /summary/:sessionId.
 *
 * Sources, in order: the finished session in `useActiveWorkoutStore` (results never leave the
 * device until the save succeeds), else the stored row from the API (already-saved sessions).
 * Saving completes the row, adapts the course scale, records benchmarks, then shows the
 * adaptation message and freshly unlocked achievements.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { TopBar } from '@/app/components/TopBar';
import { publishSessionResult } from '@/app/features/player/progress';
import { buildSummary, createSummarySaver, type SaveOutcome } from '@/app/features/player/save';
import { loadUserStats } from '@/app/features/player/stats';
import { FeedbackForm, type FeedbackValue } from '@/app/features/player/summary/FeedbackForm';
import { AchievementList, AdaptationCard } from '@/app/features/player/summary/SavedCards';
import {
  BenchmarkCard,
  BlockList,
  SummaryStats,
  TestResultList,
} from '@/app/features/player/summary/SummaryStats';
import {
  benchmarkResult,
  blockCompletions,
  courseNames,
  shareText,
  testResults,
} from '@/app/features/player/summaryModel';
import { useT } from '@/app/hooks/useT';
import {
  useActiveWorkoutStore,
  type ActiveSession,
  type PlayerResult,
} from '@/app/store/activeWorkout';
import { useSession } from '@/app/store/session';
import { isAppError } from '@/lib/api/errors';
import { getSession } from '@/lib/api/sessions';
import type { WorkoutSessionRow } from '@/lib/api/types';
import { evaluateAchievements } from '@/lib/training/levels';
import { buildPlayerSteps } from '@/lib/training/player';
import type {
  AchievementStatus,
  PlayerStep,
  SessionSummary,
  UserStats,
} from '@/lib/training/types';

type SaveStatus = 'idle' | 'saving' | 'error';

interface SavedState {
  outcome: SaveOutcome;
  unlocked: AchievementStatus[];
  workoutName: string;
  courseId: string;
}

function newlyUnlocked(before: UserStats | null, after: UserStats): AchievementStatus[] {
  if (!before) return [];
  const was = new Set(
    evaluateAchievements(before)
      .filter((a) => a.unlocked)
      .map((a) => a.id),
  );
  return evaluateAchievements(after).filter((a) => a.unlocked && !was.has(a.id));
}

async function shareOrCopy(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

function ShareButton({ text }: { text: string }) {
  const { t } = useT();
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth
      icon={<Icon name="star" size={18} />}
      onClick={() => {
        void shareOrCopy(text).then((r) => {
          if (r === 'copied') toast.show({ kind: 'success', title: t('app.summaryShareCopied') });
          if (r === 'failed') toast.show({ kind: 'error', title: t('common.errorGeneric') });
        });
      }}
    >
      {t('app.summaryShare')}
    </Button>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Saved view (after a successful save, or for a stored session)
 * ------------------------------------------------------------------------------------------- */

interface SavedViewProps {
  summary: SessionSummary;
  workoutName: string;
  courseName: string;
  nodeName: string;
  courseId: string;
  adjustment?: SaveOutcome['adjustment'];
  unlocked?: AchievementStatus[];
  alreadySaved?: boolean;
}

function SavedView({
  summary,
  workoutName,
  courseName,
  nodeName,
  courseId,
  adjustment,
  unlocked = [],
  alreadySaved,
}: SavedViewProps) {
  const { t } = useT();
  const navigate = useNavigate();
  return (
    <Screen
      header={<TopBar title={t('app.summaryEyebrow')} />}
      footer={
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={() => navigate(`/courses/${courseId}`)}>
            {t('app.summaryBackToCourse')}
          </Button>
          <ShareButton text={shareText(t, workoutName, summary)} />
        </div>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <PageTitle
          eyebrow={adjustment ? t('app.summarySavedTitle') : t('app.summaryTitle')}
          title={workoutName}
          subtitle={`${courseName} · ${nodeName}`}
        />
        {alreadySaved ? <p className="text-sm text-muted">{t('app.summaryAlreadySaved')}</p> : null}
        <SummaryStats
          durationSec={summary.durationSec}
          points={summary.points}
          calories={summary.calories}
          completion={summary.completion}
        />
        {adjustment ? <AdaptationCard adjustment={adjustment} /> : null}
        <AchievementList items={unlocked} />
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Local (unsaved) session: stats, feedback, save
 * ------------------------------------------------------------------------------------------- */

interface LocalSummaryProps {
  session: ActiveSession;
  steps: PlayerStep[];
  results: PlayerResult[];
  elapsedSec: number;
  finishedAt: string | null;
  onSaved: (saved: SavedState) => void;
}

function LocalSummary({
  session,
  steps,
  results,
  elapsedSec,
  finishedAt,
  onSaved,
}: LocalSummaryProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const weightKg = useSession((s) => s.profile?.trainingProfile?.weightKg);
  const abandon = useActiveWorkoutStore((s) => s.abandon);

  const [feedback, setFeedback] = useState<FeedbackValue>({ rpe: 5, feeling: null, note: '' });
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [before, setBefore] = useState<UserStats | null>(null);
  const saver = useRef<(() => Promise<SaveOutcome>) | null>(null);
  const completedAt = useMemo(() => finishedAt ?? new Date().toISOString(), [finishedAt]);

  const names = courseNames(session.courseId, session.nodeId, session.workoutId, locale);
  const prescribed = session.prescribed;

  // Points, calories and completion do not depend on the feedback: preview them right away.
  const preview = useMemo(
    () =>
      buildSummary({
        session,
        steps,
        results,
        feedback: { rpe: 5, feeling: 'ok' },
        completedAt,
        elapsedSec,
        ...(weightKg !== undefined ? { weightKg } : {}),
      }),
    [session, steps, results, completedAt, elapsedSec, weightKg],
  );
  const blocks = useMemo(
    () => blockCompletions(prescribed, steps, results, t, locale),
    [prescribed, steps, results, t, locale],
  );
  const tests = useMemo(
    () => testResults(prescribed, steps, results, locale),
    [prescribed, steps, results, locale],
  );
  const benchmark = useMemo(() => benchmarkResult(steps, results), [steps, results]);

  // Baseline for "what did this session unlock"; a failure only hides the achievements card.
  useEffect(() => {
    let alive = true;
    loadUserStats()
      .then((s) => {
        if (alive) setBefore(s);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const save = useCallback(async () => {
    if (!feedback.feeling) return;
    setStatus('saving');
    setErrorText(null);
    if (!saver.current) {
      saver.current = createSummarySaver({
        session,
        steps,
        results,
        feedback: {
          rpe: feedback.rpe,
          feeling: feedback.feeling,
          ...(feedback.note.trim() ? { note: feedback.note.trim() } : {}),
        },
        completedAt,
        elapsedSec,
        ...(weightKg !== undefined ? { weightKg } : {}),
      });
    }
    try {
      const outcome = await saver.current();
      let unlocked: AchievementStatus[] = [];
      try {
        unlocked = newlyUnlocked(before, await loadUserStats());
      } catch {
        /* Stats are decorative here; the save itself succeeded. */
      }
      onSaved({ outcome, unlocked, workoutName: names.workout, courseId: session.courseId });
      abandon();
      publishSessionResult(outcome);
      toast.show({ kind: 'success', title: t('app.summarySavedTitle') });
    } catch (e) {
      setStatus('error');
      setErrorText(
        isAppError(e) && e.code === 'network'
          ? t('common.errorOffline')
          : t('app.summarySaveError'),
      );
    }
  }, [
    feedback,
    session,
    steps,
    results,
    completedAt,
    elapsedSec,
    weightKg,
    before,
    onSaved,
    abandon,
    toast,
    t,
    names.workout,
  ]);

  const locked = status !== 'idle';

  return (
    <Screen
      header={
        <TopBar
          title={t('app.summaryEyebrow')}
          back={() => navigate(`/courses/${session.courseId}`)}
        />
      }
      footer={
        <div className="flex flex-col gap-2">
          {errorText ? (
            <p role="alert" className="text-center text-sm text-danger">
              {errorText}
            </p>
          ) : null}
          <Button
            size="lg"
            fullWidth
            loading={status === 'saving'}
            disabled={!feedback.feeling}
            onClick={() => void save()}
          >
            {status === 'saving'
              ? t('app.summarySaving')
              : status === 'error'
                ? t('common.retry')
                : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <PageTitle
          eyebrow={t('app.summaryTitle')}
          title={names.workout}
          subtitle={`${names.course} · ${names.node}`}
        />
        <SummaryStats
          durationSec={preview.durationSec}
          points={preview.points}
          calories={preview.calories}
          completion={preview.completion}
        />
        <BlockList blocks={blocks} />
        <TestResultList tests={tests} />
        <BenchmarkCard result={benchmark} />
        <FeedbackForm value={feedback} onChange={setFeedback} disabled={locked} />
      </div>
    </Screen>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Stored session (no local results): read-only summary
 * ------------------------------------------------------------------------------------------- */

function RemoteSummary({ sessionId }: { sessionId: string }) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [row, setRow] = useState<WorkoutSessionRow | null>(null);
  const [error, setError] = useState<'not_found' | 'network' | 'unknown' | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSession(sessionId)
      .then((r) => setRow(r))
      .catch((e: unknown) => {
        const code = isAppError(e) ? e.code : 'unknown';
        setError(code === 'not_found' ? 'not_found' : code === 'network' ? 'network' : 'unknown');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const header = <TopBar title={t('app.summaryEyebrow')} back="/" />;

  if (loading) {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-4 py-4">
          <Skeleton className="h-10 w-2/3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </Screen>
    );
  }

  if (error || !row) {
    const notFound = error === 'not_found' || !row;
    return (
      <Screen header={header}>
        <EmptyState
          icon={notFound ? 'info' : 'warning'}
          title={notFound ? t('app.summaryNotFoundTitle') : t('app.summaryLoadErrorTitle')}
          description={
            notFound
              ? t('app.summaryNotFoundBody')
              : error === 'network'
                ? t('common.errorOffline')
                : t('common.errorGeneric')
          }
          action={
            notFound ? (
              <Button onClick={() => navigate('/')}>{t('app.tabHome')}</Button>
            ) : (
              <Button onClick={load}>{t('common.retry')}</Button>
            )
          }
        />
      </Screen>
    );
  }

  const names = courseNames(row.courseId, row.nodeId, row.workoutId, locale);

  if (!row.completedAt || row.completion === null) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="info"
          title={t('app.summaryNoResultsTitle')}
          description={t('app.summaryNoResultsBody')}
          action={
            <Button onClick={() => navigate(`/courses/${row.courseId}`)}>
              {t('app.summaryBackToCourse')}
            </Button>
          }
        />
      </Screen>
    );
  }

  const summary: SessionSummary = {
    sessionId: row.id,
    courseId: row.courseId,
    nodeId: row.nodeId,
    workoutId: row.workoutId,
    choice: row.difficulty ?? row.prescribed?.choice ?? 'normal',
    scale: row.scale ?? row.prescribed?.scale ?? 1,
    completion: row.completion,
    rpe: row.rpe ?? 5,
    feeling: row.feeling ?? 'ok',
    points: row.points,
    durationSec: row.durationSec ?? 0,
    calories: row.calories ?? 0,
    completedAt: row.completedAt,
  };

  return (
    <SavedView
      summary={summary}
      workoutName={names.workout}
      courseName={names.course}
      nodeName={names.node}
      courseId={row.courseId}
      alreadySaved
    />
  );
}

/* ---------------------------------------------------------------------------------------------
 * Screen
 * ------------------------------------------------------------------------------------------- */

export default function SummaryScreen() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const { locale } = useT();
  const session = useActiveWorkoutStore((s) => s.session);
  const steps = useActiveWorkoutStore((s) => s.steps);
  const results = useActiveWorkoutStore((s) => s.results);
  const elapsedSec = useActiveWorkoutStore((s) => s.elapsedSec);
  const finishedAt = useActiveWorkoutStore((s) => s.finishedAt);
  const [saved, setSaved] = useState<SavedState | null>(null);

  if (saved) {
    const names = courseNames(
      saved.outcome.summary.courseId,
      saved.outcome.summary.nodeId,
      saved.outcome.summary.workoutId,
      locale,
    );
    return (
      <SavedView
        summary={saved.outcome.summary}
        workoutName={saved.workoutName}
        courseName={names.course}
        nodeName={names.node}
        courseId={saved.courseId}
        adjustment={saved.outcome.adjustment}
        unlocked={saved.unlocked}
      />
    );
  }

  if (session && session.sessionId === sessionId) {
    const localSteps = steps.length > 0 ? steps : buildPlayerSteps(session.prescribed);
    return (
      <LocalSummary
        session={session}
        steps={localSteps}
        results={results}
        elapsedSec={elapsedSec}
        finishedAt={finishedAt}
        onSaved={setSaved}
      />
    );
  }

  return <RemoteSummary sessionId={sessionId} />;
}

export type { SavedState };
