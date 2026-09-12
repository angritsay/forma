/**
 * Loading the marathon the athlete is in.
 *
 * A person is in at most one running marathon at a time in practice, so the hooks here resolve to
 * a single one rather than making every screen pick. If that ever stops being true the list is
 * still there — `marathons` holds all of them and `marathon` is simply the first.
 */
import { useCallback, useEffect, useState } from 'react';
import { toAppError, type AppError } from '@/lib/api/errors';
import {
  getMarathonDay,
  getMarathonMyPoints,
  getMarathonRoster,
  getMarathonScores,
  listMyMarathons,
} from '@/lib/api/marathon';
import type {
  MarathonDayPoints,
  MarathonRosterRow,
  MarathonScoreRow,
  MarathonTodayTask,
  MyMarathon,
} from '@/lib/api/types';

export type LoadStatus = 'loading' | 'ready' | 'error';

interface Loaded<T> {
  data: T;
  status: LoadStatus;
  error: AppError | null;
  reload: () => void;
}

/** Run a loader, drop stale responses, expose a reload. The shape every hook below returns. */
function useLoader<T>(load: () => Promise<T>, initial: T, deps: readonly unknown[]): Loaded<T> {
  const [data, setData] = useState<T>(initial);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<AppError | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setError(null);
    load()
      .then((value) => {
        if (!alive) return;
        setData(value);
        setStatus('ready');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(toAppError(e));
        setStatus('error');
      });
    return () => {
      alive = false;
    };
    // The loader closes over the deps the caller lists; re-running on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, status, error, reload };
}

export interface MarathonState extends Loaded<MyMarathon[]> {
  /** The one the screens work with: the running marathon, or the most recent finished one. */
  marathon: MyMarathon | null;
}

export function useMyMarathons(): MarathonState {
  const loaded = useLoader<MyMarathon[]>(() => listMyMarathons(), [], []);
  const active = loaded.data.find((m) => m.status === 'active') ?? loaded.data[0] ?? null;
  return { ...loaded, marathon: active };
}

export function useMarathonDay(
  marathon: MyMarathon | null,
  dayIndex: number,
): Loaded<MarathonTodayTask[]> {
  return useLoader<MarathonTodayTask[]>(
    () => (marathon && dayIndex >= 1 ? getMarathonDay(marathon, dayIndex) : Promise.resolve([])),
    [],
    [marathon?.id, dayIndex],
  );
}

export function useMarathonScores(
  marathonId: string | null,
  week: number | null,
): Loaded<MarathonScoreRow[]> {
  return useLoader<MarathonScoreRow[]>(
    () => (marathonId ? getMarathonScores(marathonId, week ?? undefined) : Promise.resolve([])),
    [],
    [marathonId, week],
  );
}

export function useMarathonMyPoints(marathonId: string | null): Loaded<MarathonDayPoints[]> {
  return useLoader<MarathonDayPoints[]>(
    () => (marathonId ? getMarathonMyPoints(marathonId) : Promise.resolve([])),
    [],
    [marathonId],
  );
}

export function useMarathonRoster(marathonId: string | null): Loaded<MarathonRosterRow[]> {
  return useLoader<MarathonRosterRow[]>(
    () => (marathonId ? getMarathonRoster(marathonId) : Promise.resolve([])),
    [],
    [marathonId],
  );
}
