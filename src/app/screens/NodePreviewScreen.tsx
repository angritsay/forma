/**
 * Node preview (docs/SPEC.md §10 flow 5): hero, description, difficulty chooser with estimates
 * and the recommendation, the concrete plan, and "Start workout" which opens a session and
 * hands it to the player.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { COURSE_BY_ID } from '@/content/registry';
import { formatNumber } from '@/i18n/index';
import { startSession } from '@/lib/api/sessions';
import { estimateCalories, estimateDuration } from '@/lib/training/estimate';
import { prescribeWorkout } from '@/lib/training/prescribe';
import { recommendDifficulty } from '@/lib/training/session';
import type {
  DifficultyChoice,
  PrescribeOptions,
  PrescribedWorkout,
  Recommendation,
} from '@/lib/training/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { courseLandingHref } from '@/app/features/courses/courseMeta';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { DifficultyChooser, type DifficultyOption } from '@/app/features/path/DifficultyChooser';
import { nodeStatus } from '@/app/features/path/nodeState';
import { DIFFICULTY_CHOICES, workoutSignatureExercise } from '@/app/features/path/plan';
import { PlanBlocks } from '@/app/features/path/PlanBlocks';
import { useTrainingContext } from '@/app/features/path/useTrainingContext';
import { useActiveWorkoutStore } from '@/app/store/activeWorkout';
import {
  useCourseStateRow,
  useEngineCourseState,
  useProgress,
  useProgressLoader,
  useStepsYesterday,
  useStreak,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

interface Plan extends DifficultyOption {
  prescribed: PrescribedWorkout;
}

export default function NodePreviewScreen() {
  useProgressLoader();
  const { id = '', nodeId = '' } = useParams();
  const { t, l, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();

  const course = COURSE_BY_ID.get(id);
  const nodeIndex = course ? course.nodes.findIndex((n) => n.id === nodeId) : -1;
  const node = nodeIndex >= 0 ? course?.nodes[nodeIndex] : undefined;
  const workout =
    course && node?.workoutId ? course.workouts.find((w) => w.id === node.workoutId) : undefined;

  const entitlements = useSession((s) => s.entitlements);
  const status = useProgress((s) => s.status);
  const row = useCourseStateRow(course?.id);
  const engineState = useEngineCourseState(course?.id ?? '');
  const ctx = useTrainingContext();
  const streak = useStreak();
  const stepsYesterday = useStepsYesterday();
  const activeSession = useActiveWorkoutStore((s) => s.session);
  const [choice, setChoice] = useState<DifficultyChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  // "Now" is fixed per mount so the recommendation does not flicker between renders.
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const repeat = row?.completedNodeIds.includes(nodeId) ?? false;
  const deload = node?.deload === true;
  const streakDays = streak.current;

  const recommendation = useMemo<Recommendation | null>(
    () =>
      ctx.profile
        ? recommendDifficulty(engineState, ctx.profile, nowIso, { stepsYesterday })
        : null,
    [ctx.profile, engineState, nowIso, stepsYesterday],
  );

  const plans = useMemo<Plan[] | null>(() => {
    if (!workout || !ctx.profile) return null;
    const profile = ctx.profile;
    return DIFFICULTY_CHOICES.map((c) => {
      const opts: PrescribeOptions = {
        profile,
        scale: engineState.scale,
        choice: c,
        level: ctx.level,
        deload,
        repeat,
        streakDays,
      };
      const prescribed = prescribeWorkout(workout, opts);
      return {
        choice: c,
        prescribed,
        durationSec: estimateDuration(prescribed).totalSec,
        points: prescribed.points,
        calories: estimateCalories(prescribed, ctx.weightKg),
      };
    });
  }, [workout, ctx, engineState.scale, deload, repeat, streakDays]);

  const selected: DifficultyChoice = choice ?? recommendation?.choice ?? 'normal';
  const plan = plans?.find((p) => p.choice === selected) ?? null;

  if (!course || !node) {
    return (
      <Screen header={<TopBar back="/courses" />}>
        <EmptyState
          icon="warning"
          title={t('app.nodeNotFound')}
          action={<Button onClick={() => navigate('/courses')}>{t('app.tabCourses')}</Button>}
        />
      </Screen>
    );
  }
  if (!entitlements.includes(course.id)) {
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
  if (node.kind === 'rest' || node.kind === 'milestone' || !workout) {
    return <Navigate to={`/courses/${course.id}`} replace />;
  }

  const backPath = `/courses/${course.id}`;
  const header = <TopBar back={backPath} title={l(node.title)} />;

  if (!ctx.profile) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="user"
          title={t('app.nodeProfileMissingTitle')}
          description={t('app.nodeProfileMissingBody')}
          action={
            <Button size="lg" onClick={() => navigate('/onboarding')}>
              {t('app.nodeProfileMissingCta')}
            </Button>
          }
        />
      </Screen>
    );
  }

  if (status === 'loading' || status === 'idle' || !plans || !recommendation) {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-4 py-2" aria-hidden="true">
          <Skeleton rounded="card" className="h-56" />
          <Skeleton lines={3} />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton rounded="card" className="h-28" />
            <Skeleton rounded="card" className="h-28" />
            <Skeleton rounded="card" className="h-28" />
          </div>
          <Skeleton rounded="card" className="h-40" />
        </div>
      </Screen>
    );
  }

  const locked = nodeStatus(nodeIndex, course.nodes, row) === 'locked';
  const exercise = workoutSignatureExercise(workout);
  const figureStyle = {
    '--course-g1': course.gradient[0],
    '--course-g2': course.gradient[1],
  } as CSSProperties;
  const profile = ctx.profile;

  const start = async () => {
    if (!plan || locked) return;
    setReplaceOpen(false);
    setBusy(true);
    try {
      const state = await useProgress.getState().ensureCourseState(course.id);
      // The stored scale wins if it changed since the estimates were computed.
      const prescribed =
        state.scale === plan.prescribed.scale
          ? plan.prescribed
          : prescribeWorkout(workout, {
              profile,
              scale: state.scale,
              choice: plan.choice,
              level: ctx.level,
              deload,
              repeat,
              streakDays: streak.current,
            });
      const startedAt = new Date().toISOString();
      const { id: sessionId } = await startSession({
        courseId: course.id,
        nodeId: node.id,
        workoutId: workout.id,
        difficulty: prescribed.choice,
        scale: state.scale,
        prescribed,
        localDate: toLocalDateIso(),
      });
      useActiveWorkoutStore.getState().begin({
        sessionId,
        courseId: course.id,
        nodeId: node.id,
        workoutId: workout.id,
        prescribed,
        startedAt,
      });
      navigate('/play');
    } catch {
      toast.show({ kind: 'error', title: t('app.nodeStartError') });
    } finally {
      setBusy(false);
    }
  };

  // Beginning a session replaces the persisted one, so an unsaved workout must be confirmed away.
  const onStartPress = () => {
    if (activeSession) setReplaceOpen(true);
    else void start();
  };

  const isTest = node.kind === 'test';
  const isBenchmark = node.kind === 'benchmark';

  return (
    <Screen
      header={header}
      footer={
        <div className="flex flex-col gap-2">
          {locked ? <p className="text-center text-sm text-muted">{t('app.nodeLocked')}</p> : null}
          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={locked || !plan}
            onClick={onStartPress}
            icon={<Icon name="play" size={18} />}
          >
            {t('app.nodeStart')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <Card gradient={course.gradient} padding="md" className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">
                {l(course.name)} · {t('app.homeTodayWeek', { week: node.week, day: node.day })}
              </span>
              <h2 className="font-display mt-1 text-[28px] text-balance">{l(workout.name)}</h2>
              <p className="mt-1 text-sm font-medium opacity-80">{l(workout.focus)}</p>
            </div>
            <div className="w-28 shrink-0 overflow-hidden rounded-inner" style={figureStyle}>
              <ExerciseFigure
                animation={exercise?.animation ?? 'air_squat'}
                variant="hero"
                gradient={course.gradient}
                label={exercise ? l(exercise.name) : undefined}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isTest ? (
              <Badge tone="on-art" icon="trophy" size="md">
                {t('app.nodeTestBadge')}
              </Badge>
            ) : null}
            {isBenchmark ? (
              <Badge tone="on-art" icon="trophy" size="md">
                {t('app.nodeBenchmarkBadge')}
              </Badge>
            ) : null}
            {deload ? (
              <Badge tone="on-art" size="md">
                {t('training.deloadBadge')}
              </Badge>
            ) : null}
            {repeat ? (
              <Badge tone="on-art" icon="refresh" size="md">
                {t('training.repeatPoints')}
              </Badge>
            ) : null}
          </div>
        </Card>

        <p className="text-[15px] leading-relaxed text-muted">{l(workout.description)}</p>

        {isTest || isBenchmark ? (
          <Card level={2} className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <Icon name="trophy" size={18} className="text-accent" />
              {isTest ? t('app.nodeTestTitle') : t('app.nodeBenchmarkTitle')}
            </h3>
            <p className="text-sm text-muted">
              {isTest ? t('app.nodeTestBody') : t('app.nodeBenchmarkBody')}
            </p>
          </Card>
        ) : null}

        {deload ? (
          <p className="flex gap-2 text-sm text-muted">
            <Icon name="info" size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>{t('app.nodeDeloadNote')}</span>
          </p>
        ) : null}
        {repeat ? (
          <p className="flex gap-2 text-sm text-muted">
            <Icon name="refresh" size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>{t('app.nodeRepeatNote')}</span>
          </p>
        ) : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              {t('app.nodeDifficultyTitle')}
            </h3>
            <span className="tabular text-xs text-muted-2">
              {t('app.nodeEstimatedFor', { scale: formatNumber(locale, engineState.scale, 2) })}
            </span>
          </div>
          <DifficultyChooser
            options={plans}
            value={selected}
            onChange={setChoice}
            recommended={recommendation}
          />
        </section>

        {plan ? (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
              {t('app.nodePlanTitle')}
            </h3>
            <PlanBlocks prescribed={plan.prescribed} />
          </section>
        ) : null}
      </div>

      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title={t('app.nodeReplaceTitle')}
        description={t('app.nodeReplaceBody')}
        confirmLabel={t('app.nodeStart')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => void start()}
      />
    </Screen>
  );
}
