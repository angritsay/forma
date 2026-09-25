/**
 * Session summary + feedback (docs/SPEC.md §10 flow 7) at /summary/:sessionId.
 *
 * Sources, in order: the finished session in `useActiveWorkoutStore` (results never leave the
 * device until the save succeeds), else the stored row from the API (already-saved sessions).
 * Saving completes the row, adapts the course scale, records benchmarks, then shows the
 * adaptation message and freshly unlocked achievements.
 *
 * Drawn as the owner's prototype draws this moment (`design/ui_kits/app-v2`, «Готово!»): the word
 * at the size of the screen, one warm line computed from the real count, three numerals, «К пути
 * →» and «Как зашло?». What went was the kicker-and-subtitle stack, the crosshair plate holding
 * the clock, the two stat tiles and the sentence «Эти итоги уже сохранены» — the first three are
 * the poster now, and the last was a caption about the app's own bookkeeping on the one screen
 * that should be about the person. The per-block, per-test and benchmark record moved behind
 * «Подробности», the way «Прогресс» keeps its charts: it is the answer to a question nobody
 * arrives with.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { TopBar } from '@/app/components/TopBar';
import { publishSessionResult } from '@/app/features/player/progress';
import { buildSummary, createSummarySaver, type SaveOutcome } from '@/app/features/player/save';
import { playCue } from '@/app/features/player/sound';
import { loadUserStats } from '@/app/features/player/stats';
import { DonePoster } from '@/app/features/player/summary/DonePoster';
import { doneFigures } from '@/app/features/player/summary/figures';
import { ShareButton } from '@/app/features/share/ShareButton';
import { FeedbackForm, type FeedbackValue } from '@/app/features/player/summary/FeedbackForm';
import { AchievementList, AdaptationCard } from '@/app/features/player/summary/SavedCards';
import {
  BenchmarkCard,
  BlockList,
  TestResultList,
} from '@/app/features/player/summary/SummaryStats';
import {
  benchmarkResult,
  blockCompletions,
  courseNames,
  workoutCountLine,
  testResults,
  totalReps,
} from '@/app/features/player/summaryModel';
import { UnlockCard } from '@/app/features/courses/UnlockCard';
import { useProgress, useProgressLoader, useTrainingCount } from '@/app/store/progress';
import { nodeEarnsStars, starsEarned, starsForSession, workDone } from '@/lib/training/stars';
import { useT } from '@/app/hooks/useT';

/**
 * Whether this day is graded at all: a test, a benchmark and a coach's own workout are not.
 *
 * A workout built by hand belongs to no course path, so `findCourse` answers nothing for it and
 * the day quietly earns no stars — which is right: there is no node to come back to and better.
 */
function graded(courseId: string, nodeId: string): boolean {
  const course = findCourse(courseId);
  const node = course ? findNode(course, nodeId) : undefined;
  return node !== undefined && nodeEarnsStars(node.kind);
}
import {
  useActiveWorkoutStore,
  type ActiveSession,
  type PlayerResult,
} from '@/app/store/activeWorkout';
import { useSession } from '@/app/store/session';
import { findCourse, findNode } from '@/content/catalogue';
import { isAppError } from '@/lib/api/errors';
import { haptic } from '@/lib/telegram/webapp';
import { getSession } from '@/lib/api/sessions';
import type { WorkoutSessionRow } from '@/lib/api/types';
import { evaluateAchievements } from '@/lib/training/levels';
import { buildPlayerSteps } from '@/lib/training/player';
import { courseTileVars } from '@/lib/ui/tile';
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
  /** Repetitions counted on the device before the results were dropped; null on a day with none. */
  reps: number | null;
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

/**
 * Which workout this is, **with the one just finished counted**, or null when nothing true can be
 * said.
 *
 * `enabled` is false for a session being re-read from the server: the count is a fact about now,
 * and printing «четвёртая тренировка» under a workout from last month would be a warm sentence
 * about the wrong day. While the progress store is still loading there is likewise no number, and
 * the line is simply absent rather than starting at «первая» and jumping.
 *
 * The count is days trained rather than sessions saved (`countTraining`), so a second workout on a
 * day already counted does not advance it twice — which is why `todayDone` is asked before adding
 * the one in hand.
 */
function useWorkoutNumber(enabled: boolean): number | null {
  useProgressLoader();
  const status = useProgress((s) => s.status);
  const training = useTrainingCount();
  if (!enabled || status !== 'ready') return null;
  return training.todayDone ? training.total : training.total + 1;
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
  /**
   * False for a session re-read from the server: today's count says nothing about an old workout,
   * so that view gets no warm line.
   */
  fresh?: boolean;
  /** Stars earned, or null on a day that earns none. */
  stars?: number | null;
  /** Repetitions done, or null when the session had no rep-counted work / is being re-read. */
  reps?: number | null;
}

function SavedView({
  summary,
  workoutName,
  courseName,
  nodeName,
  courseId,
  adjustment,
  unlocked = [],
  fresh,
  stars,
  reps = null,
}: SavedViewProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const days = useWorkoutNumber(fresh === true);

  /*
   * Награда звучит.
   *
   * Один раз, сколько бы значков ни открылось разом: поздравляет сам факт, а не каждая строчка в
   * списке. И только на свежем сохранении — на этот экран можно прийти по ссылке через неделю,
   * и фанфары над чужой прошлой тренировкой были бы враньём.
   *
   * Столкнуться с сигналом конца тренировки это не может: тот звучит при выходе из плеера, а
   * сюда доходят через форму обратной связи и кнопку «Сохранить», то есть минимум через
   * несколько секунд осознанных действий.
   */
  const announced = useRef(false);
  useEffect(() => {
    if (!fresh || unlocked.length === 0 || announced.current) return;
    announced.current = true;
    haptic('success');
    playCue('award');
  }, [fresh, unlocked.length]);

  return (
    <Screen
      header={<TopBar title={t('app.summaryEyebrow')} />}
      footer={
        <div className="flex flex-col gap-1">
          <Button
            variant="action"
            size="lg"
            fullWidth
            iconRight={<Glyph size={14}>→</Glyph>}
            onClick={() => navigate(courseId === 'custom' ? '/' : `/courses/${courseId}`)}
          >
            {t('app.summaryBackToCourse')}
          </Button>
          <ShareButton
            summary={summary}
            workoutName={workoutName}
            courseName={courseName}
            stars={stars ?? null}
            reps={reps}
          />
        </div>
      }
    >
      {/* The programme colour, for the block bars and the achievement rings; a custom workout has none. */}
      <div className="flex flex-col gap-8 pb-4" style={courseTileVars(findCourse(courseId)?.tile)}>
        <DonePoster
          eyebrow={`${nodeName} · ${courseName}`}
          line={days !== null ? workoutCountLine(t, days) : null}
          stars={stars}
          figures={doneFigures(t, locale, {
            durationSec: summary.durationSec,
            calories: summary.calories,
            completion: summary.completion,
            reps,
          })}
        />
        {/*
         * The two things this screen exists to hand over, in the order they earn attention: what
         * was unlocked by finishing, and how the next session changed because of this one.
         */}
        <AchievementList items={unlocked} />
        {adjustment ? <AdaptationCard adjustment={adjustment} /> : null}
        {/*
         * Момент, ради которого бесплатная тренировка и существует.
         *
         * Человек только что закончил — он знает, каково это, а не читает про это на странице. Всё
         * остальное на экране про сделанное; эта карточка — единственное, что про дальше, и стоит
         * последней, потому что сначала надо дать досмотреть свой результат.
         *
         * Показывается только тому, у кого курса нет: купившему предлагать купить — худший вид
         * невнимательности, и именно так выглядит большинство встроенных продаж.
         */}
        <UnlockCard courseId={courseId} />
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
  const [details, setDetails] = useState(false);
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
  const reps = useMemo(() => totalReps(steps, results), [steps, results]);
  /*
   * The session is finished, so today counts — whether or not the save has landed yet. The store
   * has not been told about it at this point (the save is what tells it), which is exactly what
   * `useWorkoutNumber` adds the day for.
   */
  const days = useWorkoutNumber(true);
  /*
   * Stars for the session just finished. A day that earns none — a test, a benchmark, a workout
   * the coach built by hand and so has no node — is null, and the plate simply does not draw them.
   */
  const stars = useMemo(
    () =>
      graded(session.courseId, session.nodeId)
        ? starsEarned(prescribed.choice, workDone(prescribed, results))
        : null,
    [session.courseId, session.nodeId, prescribed, results],
  );

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
      onSaved({ outcome, unlocked, workoutName: names.workout, courseId: session.courseId, reps });
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
    reps,
  ]);

  const locked = status !== 'idle';

  return (
    <Screen
      header={
        <TopBar
          title={t('app.summaryEyebrow')}
          back={() =>
            navigate(session.courseId === 'custom' ? '/' : `/courses/${session.courseId}`)
          }
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
            variant="action"
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
      <div
        className="flex flex-col gap-8 pb-2"
        style={courseTileVars(findCourse(session.courseId)?.tile)}
      >
        <DonePoster
          eyebrow={`${names.node} · ${names.course}`}
          line={days !== null ? workoutCountLine(t, days) : null}
          stars={stars}
          figures={doneFigures(t, locale, {
            durationSec: preview.durationSec,
            calories: preview.calories,
            completion: preview.completion,
            reps,
          })}
        />
        {/*
         * «Как зашло?» is open, not folded behind its own name the way the prototype leaves it.
         * The prototype's is a link because there it is optional; here the feeling is what the
         * course adapts on and the save will not go without it, so hiding the one required step
         * behind a tap would be a screen that refuses to explain why its button is dead. What the
         * prototype's restraint buys is spent instead on everything under it, which folds away.
         */}
        <FeedbackForm value={feedback} onChange={setFeedback} disabled={locked} />

        {/*
         * The per-block, per-test and benchmark record. Collapsed, like «Подробности» on
         * «Прогресс»: it is a true account of the session, and nobody finishing a workout wants it
         * first. Mounted only when opened, so the bars animate on the way in rather than having
         * quietly run behind a closed panel.
         */}
        <div className="flex flex-col gap-6">
          <div className="border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-4.5"
              onClick={() => setDetails((v) => !v)}
            >
              {details ? t('app.summaryDetailsHide') : t('app.summaryDetailsShow')}
            </Button>
          </div>
          {details ? (
            <>
              <BlockList blocks={blocks} />
              <TestResultList tests={tests} />
              <BenchmarkCard result={benchmark} />
            </>
          ) : null}
        </div>
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
  const [attempt, setAttempt] = useState(0);

  // A response for a previous session id (or a superseded retry) must never win.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getSession(sessionId)
      .then((r) => {
        if (alive) setRow(r);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        const code = isAppError(e) ? e.code : 'unknown';
        setError(code === 'not_found' ? 'not_found' : code === 'network' ? 'network' : 'unknown');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sessionId, attempt]);

  const load = useCallback(() => setAttempt((n) => n + 1), []);

  const header = <TopBar title={t('app.summaryEyebrow')} back="/" />;

  if (loading) {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-4 py-4" aria-hidden="true">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-28" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
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
              <Button variant="action" onClick={() => navigate('/')}>
                {t('app.tabCourses')}
              </Button>
            ) : (
              <Button variant="action" onClick={load}>
                {t('common.retry')}
              </Button>
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
          title={t('app.summaryNoResultsTitle')}
          description={t('app.summaryNoResultsBody')}
          action={
            <Button
              variant="action"
              onClick={() => navigate(row.courseId === 'custom' ? '/' : `/courses/${row.courseId}`)}
            >
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
      stars={graded(row.courseId, row.nodeId) ? starsForSession(row) : null}
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
        reps={saved.reps}
        fresh
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
