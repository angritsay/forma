/**
 * Node preview (docs/SPEC.md §10 flow 5): the course art, the workout's name as the one big line,
 * the description, the difficulty chooser with estimates and the recommendation, the concrete
 * plan, and "Start workout" which opens a session and hands it to the player.
 */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { courseTitle, findCourse } from '@/content/catalogue';
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
import { courseTileVars } from '@/lib/ui/tile';
import { toLocalDateIso } from '@/lib/util/dates';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { courseLandingHref } from '@/app/features/courses/courseMeta';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { DifficultyChooser, type DifficultyOption } from '@/app/features/path/DifficultyChooser';
import { FactChips } from '@/app/features/path/FactChips';
import { nodeStatus } from '@/app/features/path/nodeState';
import { DIFFICULTY_CHOICES, workoutSignatureExercise } from '@/app/features/path/plan';
import { PlanBlocks } from '@/app/features/path/PlanBlocks';
import { useTrainingContext } from '@/app/features/path/useTrainingContext';
import { WorkoutStrip } from '@/app/features/path/WorkoutStrip';
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

  const course = findCourse(id);
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
          title={t('app.nodeNotFound')}
          action={<Button onClick={() => navigate('/courses')}>{t('app.tabCourses')}</Button>}
        />
      </Screen>
    );
  }
  if (!entitlements.includes(course.id)) {
    return (
      <Screen header={<TopBar back="/courses" title={l(courseTitle(course))} />}>
        <EmptyState
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
          <Skeleton rounded="card" className="-mx-5 aspect-[4/3] lg:-mx-8" />
          <Skeleton lines={3} />
          <Skeleton rounded="card" className="h-40" />
          <Skeleton rounded="card" className="h-40" />
        </div>
      </Screen>
    );
  }

  const locked = nodeStatus(nodeIndex, course.nodes, row) === 'locked';
  const exercise = workoutSignatureExercise(workout);
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

  // The selected plan's facts: how long, how many points, how many kcal.
  const facts = plan
    ? [
        t('app.nodeDuration', { min: Math.max(1, Math.round(plan.durationSec / 60)) }),
        t('app.nodePoints', { n: plan.points }),
        t('app.nodeKcal', { n: plan.calories }),
      ]
    : [];

  return (
    /*
     * `--course-tile` scopes the screen so the art block, the formula kicker and the progress the
     * plan may draw all read the one colour.
     */
    <div style={courseTileVars(course.tile)}>
      <Screen
        header={header}
        footer={
          <div className="flex flex-col gap-2">
            {locked ? (
              <p className="text-center text-sm text-muted">{t('app.nodeLocked')}</p>
            ) : null}
            {/*
             * One button, full width. It shared the row with a «Позже» that led where the back arrow
             * and the tab bar already lead, and 112px for that left «ПОЗ…» while the one thing this
             * screen exists for read «НАЧАТЬ ТРЕНИ…». A truncated primary action is not a trade.
             */}
            <Button
              size="lg"
              fullWidth
              loading={busy}
              disabled={locked || !plan}
              onClick={onStartPress}
              iconRight={<Glyph size={14}>→</Glyph>}
            >
              {t('app.nodeStart')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 pb-2">
          {/*
           * The course art, full-bleed and square-shouldered: the programme colour with the
           * workout's signature figure drawn on it in the ink the colour wants, and the day's
           * stamps in the corner as dark plates.
           */}
          <div className="hero-art relative -mx-5 flex aspect-[4/3] items-center justify-center overflow-hidden lg:-mx-8 lg:aspect-auto lg:h-[360px]">
            <div className="h-full max-h-full">
              {/*
               * The course's own tile, not a transparent one. `ExerciseFigure` derives its ink from
               * whatever tile it is given, and a transparent tile reads as dark — which drew a white
               * figure on the yellow cover. The block behind is already this colour, so passing it
               * changes nothing but the line, which goes to the black the brandbook asks for.
               */}
              <ExerciseFigure
                animation={exercise?.animation ?? 'air_squat'}
                variant="hero"
                tile={course.tile}
                className="h-full w-auto"
                label={exercise ? l(exercise.name) : undefined}
              />
            </div>
            {isTest || isBenchmark || deload || repeat ? (
              <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1.5">
                {isTest ? <Badge tone="on-art">{t('app.nodeTestBadge')}</Badge> : null}
                {isBenchmark ? <Badge tone="on-art">{t('app.nodeBenchmarkBadge')}</Badge> : null}
                {deload ? <Badge tone="on-art">{t('training.deloadBadge')}</Badge> : null}
                {repeat ? <Badge tone="on-art">{t('training.repeatPoints')}</Badge> : null}
              </div>
            ) : null}
          </div>

          <div>
            {/*
             * The formula, in the programme colour — the one kicker the colour is allowed. It is
             * a sentence, and a Cyrillic sentence in tracked capitals wraps on a 390px screen
             * (src/i18n/eyebrow.test.ts guards this), so it takes the sentence-case kicker slot.
             */}
            <span className="eyebrow-sentence text-course">{t('app.nodeFormulaKicker')}</span>
            <DisplayTitle as="h2" text={l(workout.name)} className="mt-2.5 text-6xl" />
            <p className="eyebrow mt-3.5">
              {l(courseTitle(course))} ·{' '}
              {t('app.homeTodayWeek', { week: node.week, day: node.day })}
            </p>
            <p className="mt-4 text-[15px] font-medium">{l(workout.focus)}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{l(workout.description)}</p>
            <FactChips items={facts} className="mt-5" />
          </div>

          {isTest || isBenchmark ? (
            <section className="flex flex-col gap-2 border-t border-border pt-4">
              <h3 className="eyebrow">
                {isTest ? t('app.nodeTestTitle') : t('app.nodeBenchmarkTitle')}
              </h3>
              <p className="text-sm text-muted">
                {isTest ? t('app.nodeTestBody') : t('app.nodeBenchmarkBody')}
              </p>
            </section>
          ) : null}

          {deload ? (
            <p className="flex gap-2 text-sm text-muted">
              <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
                //
              </Glyph>
              <span>{t('app.nodeDeloadNote')}</span>
            </p>
          ) : null}
          {repeat ? (
            <p className="flex gap-2 text-sm text-muted">
              <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
                //
              </Glyph>
              <span>{t('app.nodeRepeatNote')}</span>
            </p>
          ) : null}

          <section className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="eyebrow">{t('app.nodeDifficultyTitle')}</h3>
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

          {/*
           * The movements as pictures, before the plan as a list. «Что я сейчас буду делать» is
           * answered by shapes in one look; the numbered list below is for checking the detail.
           */}
          {plan ? <WorkoutStrip prescribed={plan.prescribed} /> : null}

          {plan ? (
            <section className="flex flex-col gap-4 border-t border-border pt-4">
              <h3 className="eyebrow">{t('app.nodePlanTitle')}</h3>
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
    </div>
  );
}
