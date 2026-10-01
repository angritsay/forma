/**
 * Preview and start a coach-built workout — reached from the carousel on «Курсы» (`/assigned/:id`)
 * or from a share link (`/shared/:token`). Loads the workout, shows what is in it, and hands it to
 * the player. Everything sits behind the app's auth + onboarding guards, so a share link opens the
 * app and the person signs in before doing the workout.
 *
 * **It is built like a course's workout, because the owner asked for that in as many words:** «там
 * уже внутри устройства этой тренировки должно быть, как внутри устройства каждой тренировки,
 * внутри курса». So the screen opens on a still from the coach's own clip with the name and the
 * facts laid on it, exactly as `NodePreviewScreen` does — same `WorkoutHero`, same scrim anchored
 * to the type rather than to the picture, same pills.
 *
 * Two things a course workout has and this one does not, and both are differences rather than
 * omissions:
 *
 *   • **No difficulty.** `useCustomWorkoutStart` starts at `normal` and scale 1 on purpose — the
 *     coach wrote these numbers for this person, and scaling them would rewrite his prescription.
 *     A chooser here would offer to overrule the person who built it.
 *   • **The plan is open, not folded.** A course workout hides it behind «Что внутри» because it
 *     is one of twenty and mostly unread. This one was made for you and arrived today; the answer
 *     to «что там» is the reason the screen is open.
 */
import { useEffect, useState } from 'react';
import type { PrescribedItem } from '@/lib/training/types';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { clsx } from 'clsx';
import { findExercise } from '@/content/catalogue';
import { getSharedCustomWorkout, listMyAssignedWorkouts } from '@/lib/api/customWorkouts';
import type { AssignedWorkoutRow } from '@/lib/api/types';
import { isAppError } from '@/lib/api/errors';
import { isPlayableStructure, type CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { TopBar } from '@/app/components/TopBar';
import { ExercisePreview } from '@/app/features/path/ExercisePreview';
import { PlanBlocks } from '@/app/features/path/PlanBlocks';
import { useT } from '@/app/hooks/useT';
import { useCustomWorkoutStart } from '@/app/features/customWorkout/useCustomWorkoutStart';
import { ReplaceWorkoutModal } from '@/app/features/player/ReplaceWorkout';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { workLabel } from '@/app/features/courses/sessionEstimate';
import { WorkoutHero } from '@/app/features/path/WorkoutHero';
import { exerciseStillUrl } from '@/lib/api/storage';
import { buildPrescribedFromCustom } from '@/lib/training/customWorkout';
import { workoutVolume } from '@/lib/training/estimate';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; offline: boolean }
  | { status: 'missing' }
  | { status: 'ready'; workout: AssignedWorkoutRow };

export default function CustomWorkoutScreen() {
  const tr = useT();
  const { t } = tr;
  const params = useParams();
  const token = params.token;
  const id = params.id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  /** Упражнение, открытое крупно поверх экрана, или null. */
  const [preview, setPreview] = useState<PrescribedItem | null>(null);
  const { start, busy, replacing, confirmReplace, cancelReplace } = useCustomWorkoutStart();

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    const load = async (): Promise<LoadState> => {
      if (token) {
        const w = await getSharedCustomWorkout(token);
        return w ? { status: 'ready', workout: w } : { status: 'missing' };
      }
      if (id) {
        const mine = await listMyAssignedWorkouts();
        const w = mine.find((x) => x.id === id);
        return w ? { status: 'ready', workout: w } : { status: 'missing' };
      }
      return { status: 'missing' };
    };
    load()
      .then((next) => {
        if (alive) setState(next);
      })
      .catch((e) => {
        if (alive) setState({ status: 'error', offline: isAppError(e) && e.code === 'network' });
      });
    return () => {
      alive = false;
    };
  }, [token, id]);

  const header = <TopBar back title={t('app.customWorkoutTitle')} />;

  if (state.status === 'loading') {
    return (
      <Screen header={header}>
        <div className="flex flex-col gap-4 py-2" aria-hidden="true">
          <Skeleton rounded="card" className="h-40" />
          <Skeleton rounded="card" className="h-24" />
        </div>
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen header={header}>
        <EmptyState
          title={t('app.customWorkoutErrorTitle')}
          description={state.offline ? t('common.errorOffline') : t('app.customWorkoutErrorBody')}
        />
      </Screen>
    );
  }

  if (state.status === 'missing') {
    return (
      <Screen header={header}>
        <EmptyState
          title={t('app.customWorkoutMissingTitle')}
          description={t('app.customWorkoutMissingBody')}
        />
      </Screen>
    );
  }

  const w = state.workout;
  const structure = w.structure as CustomWorkoutStructure | undefined;
  const playable = isPlayableStructure(structure);
  const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;

  /*
   * The movement this workout is remembered by — the first item of its first working section, the
   * same rule `workoutSignatureExercise()` uses on a course's workout. Warm-ups are skipped
   * because every workout starts with the same shoulder circles, and a screen whose picture is
   * always the same picture has no picture.
   */
  const signature = playable
    ? (structure!.sections.find((sec) => sec.kind === 'main') ?? structure!.sections[0])?.items[0]
    : undefined;
  const heroExercise = signature ? findExercise(signature.exerciseId) : undefined;
  const still = heroExercise ? exerciseStillUrl(heroExercise.id) : undefined;

  /*
   * How long and how much. The reps come from the built prescription rather than from a second
   * count written here — `workoutVolume()` is what the course's own preview reports, and it is the
   * function that knows an EMOM asks for one item per minute rather than for all of them.
   *
   * Points are the club's currency and are not shown anywhere in training.
   */
  const prescribed = playable ? buildPrescribedFromCustom(w.shortId, structure!) : null;
  const volume = prescribed ? workoutVolume(prescribed) : null;
  const facts = [
    minutes ? t('app.nodeDuration', { min: minutes }) : null,
    volume && volume.reps > 0 ? workLabel(tr, volume) : null,
  ].filter(Boolean) as string[];

  return (
    <Screen
      header={header}
      footer={
        <Button
          variant="action"
          size="lg"
          fullWidth
          loading={busy}
          disabled={!playable}
          iconRight={<Glyph size={14}>→</Glyph>}
          onClick={() => structure && start({ shortId: w.shortId, structure })}
        >
          {t('app.nodeStart')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-4">
        {/*
         * The still is the surface, not a picture inside the block — the construction
         * `NodePreviewScreen` explains at length: the frame fills it, and the name, the kicker and
         * the facts sit on the frame. Where no still exists yet there is no drawing to fall back
         * to and no coloured field either; the block's own dark surface shows through.
         *
         * The scrim is anchored to the type rather than stated as a percentage of the picture, and
         * that is the part worth copying: a workout's name is one line or three, and a percentage
         * scrim measured on the short one leaves the long one on the bright half of the frame.
         */}
        <div
          className={clsx(
            'relative -mx-6 flex flex-col justify-end overflow-hidden bg-surface md:-mx-10',
            still && 'min-h-[56svh] md:min-h-[440px]',
          )}
        >
          <WorkoutHero exercise={heroExercise} />
          <div className="photo-grain" aria-hidden="true" />
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
          <div
            className="relative px-6 pt-4 pb-7 md:px-10"
            style={
              still
                ? {
                    background:
                      'linear-gradient(180deg, rgba(var(--bg-rgb),0.82) 0%, rgba(var(--bg-rgb),0.96) 100%)',
                  }
                : undefined
            }
          >
            {/* No programme colour: a coach's workout belongs to no course, so the name is white
                where a course's would be cyan. */}
            <DisplayTitle as="h2" text={w.title} className="text-5xl" />
            {/* The coach's section tag: bleu ciel with its measured ink (4.75). */}
            <Pill tone="ciel" className="mt-3.5">
              {t('app.customWorkoutFromCoach')}
            </Pill>
            {w.description ? (
              <p className="mt-4 text-[15px] leading-relaxed text-paper/75">{w.description}</p>
            ) : null}
            {facts.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={w.title}>
                {facts.map((x) => (
                  <li key={x} className="flex min-w-0">
                    {/* `on-art` treatment: white ink on a white hairline, as on the course's own
                        preview — a fact is a pill on any ground, and on a picture it goes white. */}
                    <Pill className="border-paper/45 text-paper">{x}</Pill>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        {/*
         * The plan as the course's workout shows it — the same picture cards and the same line of
         * block chips (`PlanBlocks`), built from the same prescription the player will run, so
         * both screens look alike and the numbers cannot disagree with the workout. A card opens
         * the exercise drawer, with the coach's note for that movement on «Техника».
         */}
        {prescribed ? (
          <section className="flex flex-col gap-4 border-t border-border pt-4 pb-2">
            <h3 className="eyebrow">{t('app.nodePlanTitle')}</h3>
            <PlanBlocks prescribed={prescribed} work onOpen={setPreview} />
          </section>
        ) : (
          <p className="text-sm text-muted">{t('app.customWorkoutEmpty')}</p>
        )}
      </div>
      <ExercisePreview item={preview} onClose={() => setPreview(null)} />
      <ReplaceWorkoutModal
        open={replacing}
        loading={busy}
        onClose={cancelReplace}
        onReplace={confirmReplace}
      />
    </Screen>
  );
}
