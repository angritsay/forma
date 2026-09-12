/**
 * Node preview (docs/SPEC.md §10 flow 5): the picture, the workout's name, and «Начать».
 *
 * It used to open as a wall: the art, the focus, the description, three fact chips, a difficulty
 * chooser with estimates and a paragraph of reasoning, a grid of movement stills, and the whole
 * plan block by block — all of it unrolled before anyone had decided to train. That is a lot of
 * reading to do while standing on a mat.
 *
 * So the screen now answers one question — *what is today, and shall we go* — with a picture, a
 * name and one button. Everything else is real and still here, folded behind «Что внутри» for the
 * person who wants to check the plan before starting; most days nobody opens it.
 *
 * Pressing Начать does not lead to another preview. It asks the one question that changes what
 * happens next — how hard today should be — and the answer starts the session on the spot, landing
 * the athlete in the warm-up with the first clip already playing.
 */
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { courseTitle, findCourse } from '@/content/catalogue';
import { startSession } from '@/lib/api/sessions';
import { estimateCalories, estimateDuration, workoutVolume } from '@/lib/training/estimate';
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
import { DifficultySheet, type DifficultyOption } from '@/app/features/path/DifficultySheet';
import { FactChips } from '@/app/features/path/FactChips';
import { nodeStatus } from '@/app/features/path/nodeState';
import { DIFFICULTY_CHOICES, workoutSignatureExercise } from '@/app/features/path/plan';
import { PlanBlocks } from '@/app/features/path/PlanBlocks';
import { useTrainingContext } from '@/app/features/path/useTrainingContext';
import { WorkoutHero } from '@/app/features/path/WorkoutHero';
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
  const [chooserOpen, setChooserOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pending, setPending] = useState<DifficultyChoice | null>(null);
  const [replaceFor, setReplaceFor] = useState<DifficultyChoice | null>(null);
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
      const volume = workoutVolume(prescribed);
      return {
        choice: c,
        prescribed,
        durationSec: estimateDuration(prescribed).totalSec,
        points: prescribed.points,
        calories: estimateCalories(prescribed, ctx.weightKg),
        reps: volume.reps,
        workSec: volume.workSec,
      };
    });
  }, [workout, ctx, engineState.scale, deload, repeat, streakDays]);

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
        </div>
      </Screen>
    );
  }

  const locked = nodeStatus(nodeIndex, course.nodes, row) === 'locked';
  const exercise = workoutSignatureExercise(workout);
  const profile = ctx.profile;
  // The recommended plan is what the folded-away detail describes; it is also the likely choice.
  const shown = plans.find((p) => p.choice === recommendation.choice) ?? plans[0] ?? null;

  const start = async (choice: DifficultyChoice) => {
    const plan = plans.find((p) => p.choice === choice);
    if (!plan || locked) return;
    setReplaceFor(null);
    setPending(choice);
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
      setChooserOpen(false);
      navigate('/play');
    } catch {
      toast.show({ kind: 'error', title: t('app.nodeStartError') });
    } finally {
      setPending(null);
    }
  };

  // Beginning a session replaces the persisted one, so an unsaved workout must be confirmed away.
  const onPick = (choice: DifficultyChoice) => {
    if (activeSession) setReplaceFor(choice);
    else void start(choice);
  };

  const isTest = node.kind === 'test';
  const isBenchmark = node.kind === 'benchmark';

  // The recommended plan's facts: how long, how many points, how many kcal.
  const facts = shown
    ? [
        t('app.nodeDuration', { min: Math.max(1, Math.round(shown.durationSec / 60)) }),
        t('app.nodePoints', { n: shown.points }),
        t('app.nodeKcal', { n: shown.calories }),
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
            <Button
              size="lg"
              fullWidth
              disabled={locked || plans.length === 0}
              onClick={() => setChooserOpen(true)}
              iconRight={<Glyph size={14}>→</Glyph>}
            >
              {t('app.nodeStart')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 pb-2">
          {/*
           * The picture, full-bleed and square-shouldered: a frame from the coach's own clip where
           * the movement has been filmed, the drawn figure on the programme colour where it has
           * not, and the day's stamps in the corner as dark plates.
           */}
          <div className="hero-art relative -mx-5 flex aspect-[4/3] items-center justify-center overflow-hidden lg:-mx-8 lg:aspect-auto lg:h-[360px]">
            <WorkoutHero
              exercise={exercise}
              tile={course.tile}
              label={exercise ? l(exercise.name) : undefined}
            />
            {isTest || isBenchmark || deload || repeat ? (
              <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1.5">
                {isTest ? <Badge tone="on-art">{t('app.nodeTestBadge')}</Badge> : null}
                {isBenchmark ? <Badge tone="on-art">{t('app.nodeBenchmarkBadge')}</Badge> : null}
                {deload ? <Badge tone="on-art">{t('training.deloadBadge')}</Badge> : null}
                {repeat ? <Badge tone="on-art">{t('training.repeatPoints')}</Badge> : null}
              </div>
            ) : null}
          </div>

          {/*
           * The name, the programme and the day. Three lines, and the button is already in view
           * under them — that is the whole screen for anyone who came here to train.
           */}
          <div>
            <DisplayTitle as="h2" text={l(workout.name)} className="text-6xl" />
            <p className="eyebrow mt-3.5">
              {l(courseTitle(course))} ·{' '}
              {t('app.homeTodayWeek', { week: node.week, day: node.day })}
            </p>
            <FactChips items={facts} className="mt-5" />
          </div>

          {/*
           * Everything that used to be unrolled down the page, behind one line.
           *
           * It is a disclosure rather than a second screen because none of it is a decision: it is
           * what someone checks when they are curious, and what they never open twice.
           */}
          <section className="border-t border-border">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              aria-expanded={detailsOpen}
              className="flex w-full items-center justify-between gap-3 py-4 text-left transition-colors duration-150 ease-(--ease-out) hover:text-text"
            >
              <span className="eyebrow">{t('app.nodeWhatsInside')}</span>
              <Glyph size={14} className="text-muted-2">
                {detailsOpen ? '−' : '+'}
              </Glyph>
            </button>

            {detailsOpen ? (
              <div className="flex flex-col gap-6 pb-2">
                <div>
                  <p className="text-[15px] font-medium">{l(workout.focus)}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    {l(workout.description)}
                  </p>
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

                {shown ? <WorkoutStrip prescribed={shown.prescribed} /> : null}

                {shown ? (
                  <section className="flex flex-col gap-4 border-t border-border pt-4">
                    <h3 className="eyebrow">{t('app.nodePlanTitle')}</h3>
                    <PlanBlocks prescribed={shown.prescribed} />
                  </section>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <DifficultySheet
          open={chooserOpen && replaceFor === null}
          onClose={() => setChooserOpen(false)}
          options={plans}
          recommended={recommendation}
          pending={pending}
          onPick={onPick}
        />

        <Modal
          open={replaceFor !== null}
          onClose={() => setReplaceFor(null)}
          title={t('app.nodeReplaceTitle')}
          description={t('app.nodeReplaceBody')}
          confirmLabel={t('app.nodeStart')}
          cancelLabel={t('common.cancel')}
          danger
          loading={pending !== null}
          onConfirm={() => replaceFor && void start(replaceFor)}
        />
      </Screen>
    </div>
  );
}
