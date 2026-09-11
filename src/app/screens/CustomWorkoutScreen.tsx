/**
 * Preview and start a coach-built workout — reached from an assigned workout on Home
 * (`/assigned/:id`) or from a share link (`/shared/:token`). Loads the workout, shows what is in
 * it, and hands it to the player. Everything sits behind the app's auth + onboarding guards, so a
 * share link opens the app and the person signs in before doing the workout.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
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
        <div className="flex flex-col gap-4 py-2">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
      </Screen>
    );
  }

  if (state.status === 'error') {
    return (
      <Screen header={header}>
        <EmptyState
          icon="warning"
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
          icon="info"
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

  const sectionSummary = (section: CustomWorkoutSection, index: number) => {
    const name = section.title?.trim() || t(SECTION_KEY[section.kind]);
    return (
      <div key={index} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-accent">{name}</span>
          {section.sets > 1 ? (
            <Badge tone="neutral" size="sm">
              {t('app.customWorkoutRounds', { n: section.sets })}
            </Badge>
          ) : null}
        </div>
        <ul className="flex flex-col gap-1">
          {section.items.map((it, i) => {
            const ex = findExercise(it.exerciseId);
            const exName = ex ? l(ex.name) : it.exerciseId;
            const amount =
              it.unit === 'seconds'
                ? t('app.customWorkoutSeconds', { n: it.target })
                : t('app.customWorkoutReps', { n: it.target });
            const side = it.perSide ? ` · ${t('app.customWorkoutPerSide')}` : '';
            return (
              <li key={i} className="flex items-baseline justify-between gap-3 text-[15px]">
                <span>{exName}</span>
                <span className="tabular shrink-0 text-muted">
                  {amount}
                  {side}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
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
          icon={<Icon name="play" size={18} />}
          onClick={() => structure && start({ shortId: w.shortId, structure })}
        >
          {t('app.nodeStart')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        <Card padding="md" className="flex flex-col gap-2">
          <span className="eyebrow text-muted">{t('app.customWorkoutFromCoach')}</span>
          <h2 className="font-display text-[26px] text-balance">{w.title}</h2>
          {w.description ? <p className="text-sm text-muted">{w.description}</p> : null}
          <div className="mt-1 flex flex-wrap gap-2">
            {minutes ? (
              <Badge tone="neutral" size="md" icon="clock">
                {t('app.nodeDuration', { min: minutes })}
              </Badge>
            ) : null}
            {w.points ? (
              <Badge tone="accent" size="md" icon="star">
                {t('app.nodePoints', { n: w.points })}
              </Badge>
            ) : null}
          </div>
        </Card>
        {playable ? (
          <div className="flex flex-col gap-5">{structure!.sections.map(sectionSummary)}</div>
        ) : (
          <p className="text-sm text-muted">{t('app.customWorkoutEmpty')}</p>
        )}
      </div>
    </Screen>
  );
}
