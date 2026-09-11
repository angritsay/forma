/**
 * Preview and start a coach-built workout — reached from an assigned workout on Home
 * (`/assigned/:id`) or from a share link (`/shared/:token`). Loads the workout, shows what is in
 * it, and hands it to the player. Everything sits behind the app's auth + onboarding guards, so a
 * share link opens the app and the person signs in before doing the workout.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { findExercise } from '@/content/catalogue';
import { getSharedCustomWorkout, listMyAssignedWorkouts } from '@/lib/api/customWorkouts';
import type { AssignedWorkoutRow } from '@/lib/api/types';
import { isAppError } from '@/lib/api/errors';
import {
  isPlayableStructure,
  type CustomSectionKind,
  type CustomWorkoutSection,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import { TopBar } from '@/app/components/TopBar';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { useCustomWorkoutStart } from '@/app/features/customWorkout/useCustomWorkoutStart';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { FactChips } from '@/app/features/path/FactChips';

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

export default function CustomWorkoutScreen() {
  const { t, l } = useT();
  const params = useParams();
  const token = params.token;
  const id = params.id;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
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
  const facts = [
    ...(minutes ? [t('app.nodeDuration', { min: minutes })] : []),
    ...(w.points ? [t('app.nodePoints', { n: w.points })] : []),
  ];

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
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 border-t border-border py-2.5 text-[15px] first:border-t-0"
              >
                <span className="min-w-0 truncate">{exName}</span>
                <span className="tabular shrink-0 text-sm text-muted">
                  {amount}
                  {side}
                </span>
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
      <div className="flex flex-col gap-6 py-4">
        <div>
          <span className="eyebrow">{t('app.customWorkoutFromCoach')}</span>
          <DisplayTitle as="h2" text={w.title} className="mt-2.5 text-6xl" />
          {w.description ? (
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{w.description}</p>
          ) : null}
          <FactChips items={facts} className="mt-5" />
        </div>
        {playable ? (
          <div className="flex flex-col gap-5">{structure!.sections.map(sectionSummary)}</div>
        ) : (
          <p className="text-sm text-muted">{t('app.customWorkoutEmpty')}</p>
        )}
      </div>
    </Screen>
  );
}
