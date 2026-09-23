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
import {
  isPlayableStructure,
  type CustomSectionKind,
  type CustomWorkoutItem,
  type CustomWorkoutSection,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import { TopBar } from '@/app/components/TopBar';
import { ExercisePreview } from '@/app/features/path/ExercisePreview';
import { mainOnly } from '@/app/features/path/mainWork';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { useCustomWorkoutStart } from '@/app/features/customWorkout/useCustomWorkoutStart';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { workLabel } from '@/app/features/courses/sessionEstimate';
import { WorkoutHero } from '@/app/features/path/WorkoutHero';
import { exerciseStillUrl } from '@/lib/api/storage';
import { buildPrescribedFromCustom } from '@/lib/training/customWorkout';
import { workoutVolume } from '@/lib/training/estimate';

const SECTION_KEY: Record<CustomSectionKind, TKey> = {
  warmup: 'app.playerSectionWarmup',
  main: 'app.playerSectionMain',
  cooldown: 'app.playerSectionCooldown',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; offline: boolean }
  | { status: 'missing' }
  | { status: 'ready'; workout: AssignedWorkoutRow };

/**
 * Упражнение конструктора в том виде, в каком его ждёт карточка из плеера.
 *
 * Строится здесь, а не берётся из `buildPrescribedFromCustom`: после того как из списка убрали
 * разминку и заминку, порядковые номера в плане и в предписании разошлись, и искать по индексу
 * значило бы однажды открыть не то движение. Нужных полей всего четыре, остальные — нули, потому
 * что превью не считает ни время, ни отдых.
 *
 * Вес не проставляется: в конструкторе его нет, и «Осторожно» покажет противопоказания без него.
 */
function previewItem(it: CustomWorkoutItem): PrescribedItem {
  return {
    exerciseId: it.exerciseId,
    originalExerciseId: it.exerciseId,
    substituted: false,
    unit: it.unit,
    target: it.target,
    perSide: it.perSide === true,
    restAfterSec: 0,
    estimatedSec: 0,
  };
}

export default function CustomWorkoutScreen() {
  const tr = useT();
  const { t, l } = tr;
  const params = useParams();
  const token = params.token;
  const id = params.id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  /** Упражнение, открытое крупно поверх экрана, или null. */
  const [preview, setPreview] = useState<PrescribedItem | null>(null);
  const { start, busy } = useCustomWorkoutStart();

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
  const volume = playable ? workoutVolume(buildPrescribedFromCustom(w.shortId, structure!)) : null;
  const facts = [
    minutes ? t('app.nodeDuration', { min: minutes }) : null,
    volume && volume.reps > 0 ? workLabel(tr, volume) : null,
  ].filter(Boolean) as string[];

  /*
   * Each part of the workout as a numbered ruled section: 01 and its name as the kicker, the
   * rounds as a plain figure beside it, then the movements with their amounts on the right.
   * A coach's workout belongs to no course, so nothing on this screen takes a colour.
   */
  const sectionSummary = (section: CustomWorkoutSection, index: number) => {
    const name = section.title?.trim() || t(SECTION_KEY[section.kind]);
    return (
      <section key={index} className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-baseline gap-3">
          <span className="numeral text-sm text-muted">{String(index + 1).padStart(2, '0')}</span>
          <h3 className="eyebrow">{name}</h3>
          {section.sets > 1 ? (
            <span className="numeral tabular ml-auto text-xs text-muted">
              {t('app.customWorkoutRounds', { n: section.sets })}
            </span>
          ) : null}
        </div>
        <ul className="flex flex-col">
          {section.items.map((it, i) => {
            const ex = findExercise(it.exerciseId);
            const exName = ex ? l(ex.name) : it.exerciseId;
            const amount =
              it.unit === 'seconds'
                ? t('app.customWorkoutSeconds', { n: it.target })
                : t('app.customWorkoutReps', { n: it.target });
            const side = it.perSide ? ` · ${t('app.customWorkoutPerSide')}` : '';
            return (
              /*
               * Нажимается, когда упражнение есть в базе: тогда оно открывается крупно, тем же
               * компонентом, что в плеере. Нет в базе — обычная строка: элемент, который выглядит
               * нажимаемым и ничего не делает, хуже ненажимаемого.
               */
              <li key={i} className="border-t border-border first:border-t-0">
                {ex ? (
                  <button
                    type="button"
                    onClick={() => setPreview(previewItem(it))}
                    className="flex w-full items-baseline justify-between gap-3 py-2.5 text-left text-[15px] transition-colors duration-150 ease-(--ease-out) hover:text-text"
                  >
                    <span className="min-w-0 truncate">{exName}</span>
                    <span className="tabular shrink-0 text-sm text-muted">
                      {amount}
                      {side}
                    </span>
                  </button>
                ) : (
                  <span className="flex items-baseline justify-between gap-3 py-2.5 text-[15px]">
                    <span className="min-w-0 truncate">{exName}</span>
                    <span className="tabular shrink-0 text-sm text-muted">
                      {amount}
                      {side}
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <Screen
      header={header}
      footer={
        <Button
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
                  'linear-gradient(180deg, rgba(26,26,26,0) 0%, rgba(26,26,26,0.28) 46%, rgba(26,26,26,0.62) 74%, rgba(26,26,26,0.82) 100%)',
              }}
            />
          ) : null}
          <div
            className="relative px-6 pt-4 pb-7 md:px-10"
            style={
              still
                ? {
                    background:
                      'linear-gradient(180deg, rgba(26,26,26,0.82) 0%, rgba(26,26,26,0.96) 100%)',
                  }
                : undefined
            }
          >
            {/* No programme colour: a coach's workout belongs to no course, so the name is white
                where a course's would be cyan. */}
            <DisplayTitle as="h2" text={w.title} className="text-5xl" />
            <p className="eyebrow mt-3.5 text-paper/75">{t('app.customWorkoutFromCoach')}</p>
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
        {playable ? (
          <div className="flex flex-col gap-5">
            {mainOnly(structure!.sections, (x) => x.kind).map(sectionSummary)}
          </div>
        ) : (
          <p className="text-sm text-muted">{t('app.customWorkoutEmpty')}</p>
        )}
      </div>
      <ExercisePreview item={preview} onClose={() => setPreview(null)} />
    </Screen>
  );
}
