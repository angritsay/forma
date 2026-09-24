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
 * The picture is the *surface* of that answer and not an illustration above it. This is the screen
 * the owner photographed when she said «используется старый стиль»: a flat field of the programme
 * colour with a black panel of type under it. Her two mockups rule that colour lands on type and
 * never on a fill, and that a photograph carries what is written on it with no panel beneath — so
 * the field became the still, and the title, the kicker and the three facts came up onto the
 * picture. The title is white with a light-blue key word (the semantic colour map, global.css
 * header): the programme's orange on a photograph measured low and said nothing — orange means
 * effort in this product, and the course colour is identity for its tile and tag only. See the hero block below for how the contrast on it is
 * held, and `features/courses/CourseCard.tsx` for where this construction was first built.
 *
 * Pressing Начать does not lead to another preview. It asks the one question that changes what
 * happens next — how hard today should be — and the answer starts the session on the spot, landing
 * the athlete in the warm-up with the first clip already playing.
 */
import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { Pill } from '@/components/ui/Pill';
import { courseTitle, findCourse } from '@/content/catalogue';
import { startSession } from '@/lib/api/sessions';
import { exerciseStillUrl } from '@/lib/api/storage';
import { prescribeWorkout } from '@/lib/training/prescribe';
import { recommendDifficulty } from '@/lib/training/session';
import type { DifficultyChoice, PrescribedItem, Recommendation } from '@/lib/training/types';
import { toLocalDateIso } from '@/lib/util/dates';
import { TopBar } from '@/app/components/TopBar';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { useT } from '@/app/hooks/useT';
import { courseTileVars } from '@/lib/ui/tile';
import {
  firstTrainableNode,
  hasCompletedIn,
  nodeAccess,
} from '@/app/features/courses/courseAccess';
import { UnlockSheet } from '@/app/features/courses/UnlockSheet';
import {
  estimateSession,
  sessionPills,
  type SessionEstimate,
} from '@/app/features/courses/sessionEstimate';
import { KeyTitle } from '@/components/ui/HeroField';
import { DifficultySheet } from '@/app/features/path/DifficultySheet';
import { nodeStatus } from '@/app/features/path/nodeState';
import { DIFFICULTY_CHOICES, workoutSignatureExercise } from '@/app/features/path/plan';
import { ExercisePreview } from '@/app/features/path/ExercisePreview';
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
  useTrainedCourseIds,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

/** One difficulty's plan and its estimate — what the sheet offers as a row, what the pills state. */
type Plan = SessionEstimate;

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
  const trained = useTrainedCourseIds();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const owned = entitlements.includes(id ?? '');
  const hasCompleted = hasCompletedIn(trained, id ?? '');
  const status = useProgress((s) => s.status);
  const row = useCourseStateRow(course?.id);
  const engineState = useEngineCourseState(course?.id ?? '');
  const ctx = useTrainingContext();
  const activeSession = useActiveWorkoutStore((s) => s.session);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Упражнение, открытое крупно поверх экрана, или null. */
  const [preview, setPreview] = useState<PrescribedItem | null>(null);
  const [pending, setPending] = useState<DifficultyChoice | null>(null);
  const [replaceFor, setReplaceFor] = useState<DifficultyChoice | null>(null);
  // "Now" is fixed per mount so the recommendation does not flicker between renders.
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const repeat = row?.completedNodeIds.includes(nodeId) ?? false;
  const deload = node?.deload === true;

  const recommendation = useMemo<Recommendation | null>(
    () => (ctx.profile ? recommendDifficulty(engineState, ctx.profile, nowIso) : null),
    [ctx.profile, engineState, nowIso],
  );

  /*
   * The three plans, through the one estimator Home's card also reads (`sessionEstimate`), so
   * the «18 мин · 110 повторов» somebody saw on Home is the «Как обычно» row here to the digit.
   */
  const plans = useMemo<Plan[] | null>(() => {
    if (!workout || !ctx.profile) return null;
    const profile = ctx.profile;
    return DIFFICULTY_CHOICES.map((c) =>
      estimateSession(workout, {
        profile,
        scale: engineState.scale,
        choice: c,
        level: ctx.level,
        ...(ctx.weightKg !== undefined ? { weightKg: ctx.weightKg } : {}),
        deload,
        repeat,
      }),
    );
  }, [workout, ctx, engineState.scale, deload, repeat]);

  if (!course || !node) {
    return (
      <Screen header={<TopBar back="/courses" />}>
        <EmptyState
          title={t('app.nodeNotFound')}
          action={
            <Button variant="action" onClick={() => navigate('/')}>
              {t('app.tabCourses')}
            </Button>
          }
        />
      </Screen>
    );
  }
  /*
   * Заперт оплатой — но не выпровожен на сайт.
   *
   * Раньше здесь стоял тупик со ссылкой на страницу курса: человек уходил из приложения ровно в тот
   * момент, когда был к покупке ближе всего, и возвращался через форму, где надо заново вписать
   * почту, которую приложение и так знает. Теперь цена открывается здесь же.
   */
  if (nodeAccess({ owned, course, node }) === 'paywalled') {
    /*
     * Два разных человека упираются в этот экран, и предлагать им одно и то же нельзя.
     *
     * Первый ещё не пробовал — он просто открыл день двадцатый, ссылкой или любопытством. Ему
     * есть что дать бесплатно, и продавать ему сейчас значит брать деньги за то, что он не
     * пробовал. Его ведут к первой тренировке.
     *
     * Второй свою тренировку сделал и знает, о чём речь. Ему — цена. Та бесплатная при этом
     * никуда не делась (0022): он в любой момент откроет её на пути курса и пройдёт заново, так
     * что кнопка здесь предлагает не единственное, что ему осталось, а следующее.
     *
     * Текст «Первая тренировка была бесплатной» до этой правки показывался обоим, и первому он
     * сообщал о событии, которого не было.
     */
    const firstFree = !hasCompleted ? firstTrainableNode(course) : null;
    return (
      <Screen header={<TopBar back={`/courses/${course.id}`} title={l(courseTitle(course))} />}>
        <EmptyState
          title={t('app.pathNotOwnedTitle')}
          description={firstFree ? t('app.pathTrialLeftBody') : t('app.pathNotOwnedBody')}
          action={
            firstFree ? (
              <Button
                variant="action"
                size="lg"
                onClick={() => navigate(`/courses/${course.id}/nodes/${firstFree.id}`)}
              >
                {t('app.pathTrialLeftCta')}
              </Button>
            ) : (
              <Button variant="action" size="lg" onClick={() => setUnlockOpen(true)}>
                {t('app.unlockTitle')}
              </Button>
            )
          }
        />
        <UnlockSheet open={unlockOpen} course={course} onClose={() => setUnlockOpen(false)} />
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
            <Button variant="action" size="lg" onClick={() => navigate('/onboarding')}>
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
        <ScreenLoader />
      </Screen>
    );
  }

  const locked = nodeStatus(nodeIndex, course.nodes, row) === 'locked';
  const exercise = workoutSignatureExercise(workout);
  /*
   * Whether there is a photograph for this movement at all — the same question `ExerciseStill`
   * answers by drawing nothing. The hero only reserves a picture's worth of height, and only lays
   * the scrim that protects type on a picture, when there is a picture to protect it from.
   */
  const still = exercise ? exerciseStillUrl(exercise.id) !== undefined : false;
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

  /*
   * The recommended plan's facts as pills: how long, how much, what it costs — the same two Home
   * shows, plus the calories, which this screen has the room for. No points: a course is time you
   * are about to spend, and a score for a workout nobody has done yet is not a fact about it.
   * Pills, not the outlined-capitals chips that stood here: a fact that is not a control is a
   * pill (`design/CHANGELOG.md` §10), and the 12px radius is for what is pressed.
   */
  const facts = shown ? sessionPills({ t, l, locale }, shown, { calories: true }) : [];

  return (
    /*
     * `--course-tile` scopes the screen so the progress the plan may draw reads the one colour,
     * and `--course-accent` is that colour *as type on a photograph* — the tile where the tile is
     * a colour, plain white where the course has none, so a near-black tile can never set
     * near-black type on the picture. Both come from `courseTileVars()`, which is the «Курсы»
     * card's own answer to the same question.
     */
    <div style={courseTileVars(course.tile)}>
      <Screen
        header={header}
        footer={
          <div className="flex flex-col gap-2">
            {locked ? (
              <p className="text-center text-sm text-muted">{t('app.nodeLocked')}</p>
            ) : null}
            {/* The screen's one main action, so the neon (global.css header, style A). */}
            <Button
              variant="action"
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
           * **The photograph is the surface, and the day's name lies on it.**
           *
           * This block used to be a flat field of the programme colour — 580px of the old palette's pale cyan on a
           * 390px screen — with the title, the kicker and the facts stacked on a black panel
           * under it. That is the screen the owner photographed when she said «используется
           * старый стиль», and the two mockups answer it with one rule each: colour goes on the
           * type and never on a fill, and the picture is the surface with no panel beneath it.
           * The «Курсы» card (features/courses/CourseCard.tsx) is where that language was first
           * built; this is the same construction turned the other way up, because a card's figure
           * sits at its top and a screen's title sits at the foot of its picture.
           *
           * So: the still fills the block, the title is white at display weight with its last word
           * the light-blue key word (`KeyTitle`) — never the programme colour, which is identity
           * for the course's tile and tag and not a type colour on a photograph — and the kicker
           * and the three facts sit on the picture with it.
           *
           * Where there is no frame for the movement yet the ground is `--surface`, not the
           * programme colour, and the same white and light blue read on it.
           */}
          <div
            className={clsx(
              'relative -mx-6 flex flex-col justify-end overflow-hidden bg-surface md:-mx-10',
              /* Only a block that holds a picture reserves the height for one. A movement with no
                 frame yet keeps the type and nothing above it, rather than 250px of empty grain
                 standing in for a photograph that does not exist. */
              still && 'min-h-[56svh] md:min-h-[440px]',
            )}
          >
            <WorkoutHero exercise={exercise} />
            <div className="photo-grain" aria-hidden="true" />
            {isTest || isBenchmark || deload || repeat ? (
              <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1.5">
                {isTest ? <Badge tone="on-art">{t('app.nodeTestBadge')}</Badge> : null}
                {isBenchmark ? <Badge tone="on-art">{t('app.nodeBenchmarkBadge')}</Badge> : null}
                {deload ? <Badge tone="on-art">{t('training.deloadBadge')}</Badge> : null}
                {repeat ? <Badge tone="on-art">{t('training.repeatPoints')}</Badge> : null}
              </div>
            ) : null}

            {/*
             * The fade, 128px of it, and then the type's own ground beneath.
             *
             * **The scrim is anchored to the type and not to the picture**, which is the one thing
             * worth copying out of this block. `.photo-scrim-top` on the «Курсы» card can state
             * its stops as percentages of the card because a card is a fixed shape holding a
             * figure of fixed length. A workout's name is not: «Жим» is one line and «Отжимания,
             * приседания, «жук»» is three, so a percentage scrim that measured 8:1 on the short
             * name would leave the long one on the bright half of the frame. Giving the type block
             * its own ground and putting the fade directly above it makes the worst pixel the same
             * pixel whatever the name does.
             *
             * The numbers are measured on the composited pixels, not chosen: the dimmest type here
             * is the light-blue key word `#afe9fd`, which needs the ground at sRGB 99 or below for
             * 4.5:1. 0.82 of the graphite ground (`--bg-rgb`) over a frame that is pure white
             * composites to sRGB 61: the key word measures 8.2:1 there and the white 10.9:1;
             * every line below it sits on more (`contrast-usage.test.ts` holds both, derived from
             * `APP_BG`). A fifth of the picture still comes through the type's ground, so it is a
             * scrim and not the panel the mockups took away.
             *
             * Re-measure rather than eyeball if the alphas, the title's size or the stills change.
             */}
            {still ? (
              <div
                aria-hidden="true"
                className="pointer-events-none relative h-32"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(var(--bg-rgb),0) 0%, rgba(var(--bg-rgb),0.28) 46%, rgba(var(--bg-rgb),0.62) 74%, rgba(var(--bg-rgb),0.82) 100%)',
                }}
              />
            ) : null}

            {/*
             * The name, the programme and the day, and the facts — all on the picture. The button
             * is already in view under them; that is the whole screen for anyone who came here to
             * train.
             */}
            <div
              className="relative px-6 pb-7 md:px-10"
              style={
                still
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(var(--bg-rgb),0.82) 0%, rgba(var(--bg-rgb),0.96) 100%)',
                    }
                  : undefined
              }
            >
              <h2 className="display text-6xl text-balance text-paper">
                <KeyTitle text={l(workout.name)} />
              </h2>
              {/*
                Course and block, and the day is gone from it. It read «Форма с нуля · Неделя 1 ·
                День 1» over a title that already says «Тренировка 1» — three numbers for one
                position — and «День» was the more misleading of the two now that the path is the
                coach's twenty sessions rather than a calendar of twenty-eight.
              */}
              <p className="eyebrow mt-3.5 text-paper/75">
                {l(courseTitle(course))} · {t('app.pathWeek', { n: node.week })}
              </p>
              {facts.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label={l(workout.name)}>
                  {facts.map((x) => (
                    <li key={x} className="flex min-w-0">
                      {/* A fact is a pill on any ground (`Pill`'s own note). On a photograph it
                          takes white ink and a white hairline rather than the grey pair, which is
                          the `on-art` treatment the design system already uses for a plate laid
                          on a picture — never a lightened capsule of frosted glass. */}
                      <Pill className="border-paper/45 text-paper">{x}</Pill>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/*
           * Everything that used to be unrolled down the page, behind one line.
           *
           * It is a disclosure rather than a second screen because none of it is a decision: it is
           * what someone checks when they are curious, and what they never open twice.
           */}
          <section className="border-t border-border">
            {/*
             * План — всегда на виду, а не в свёрнутой гармошке.
             *
             * Владелец, показав такой же список у выданной тренировки: «Показывай такое же перед
             * каждой тренировкой». До этого «что я сейчас буду делать» лежало под «Что внутри»
             * вместе с описанием и примечаниями — то есть ответ на главный вопрос экрана надо было
             * сначала найти и развернуть. Гармошка осталась при прозе, которой место именно там.
             *
             * Без разминки и заминки (`work`): почему — в `mainWork.ts`.
             */}
            {shown ? (
              <section className="flex flex-col gap-4 border-t border-border pt-4 pb-2">
                <h3 className="eyebrow">{t('app.nodePlanTitle')}</h3>
                <PlanBlocks prescribed={shown.prescribed} work onOpen={setPreview} />
              </section>
            ) : null}

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
              </div>
            ) : null}
          </section>
        </div>

        <ExercisePreview item={preview} onClose={() => setPreview(null)} />

        <DifficultySheet
          open={chooserOpen && replaceFor === null}
          onClose={() => setChooserOpen(false)}
          tile={course.tile}
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
