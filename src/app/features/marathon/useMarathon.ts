/**
 * Loading the marathon the athlete is in.
 *
 * A person is in at most one running marathon at a time in practice, so the hooks here resolve to
 * a single one rather than making every screen pick. If that ever stops being true the list is
 * still there — `marathons` holds all of them and `marathon` is simply the first.
 *
 * `useMarathonMyPoints` (`marathon_my_points`) is back for one reader: the week's recap on the
 * club tab (`ClubWeekRecap`), which needs the tasks done against the tasks set for a week. The
 * «Мои баллы» screen that used to read it is still gone — «только задание и лидерборд» — and
 * the recap is a card on the tab, not a screen.
 */
import { useCallback, useEffect, useState } from 'react';
import { toAppError, type AppError } from '@/lib/api/errors';
import {
  getMarathonDay,
  getMarathonMyPoints,
  getMarathonRoster,
  getMarathonScores,
  joinClub,
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
  /*
   * Клуб существует ровно в двух видах (0033), и это решение владельца: «клуб существует только в
   * двух вариациях — соло и дуо». Различает их размер команды, а не название: `team_size` — то, по
   * чему их различает и сам индекс в базе, и второго такого признака заводить нельзя.
   *
   * `null` у любого из них — обычное дело, а не сбой: дуо-круг заводится миграцией 0033, и до её
   * применения его просто нет. Экран тогда показывает одну вкладку.
   */
  soloClub: MyMarathon | null;
  duoClub: MyMarathon | null;
}

export function useMyMarathons(): MarathonState {
  /*
   * Join the club before asking what the athlete is in, because for a subscriber those are one
   * question. «Если ты в клубе то ты участвуешь» — the row in `marathon_members` is not something
   * anyone should have to be added to by hand; opening the tab is the joining.
   *
   * **The failure is swallowed deliberately, and it is the only sensible behaviour here.** The RPC
   * says "no" by returning null, never by throwing, so a throw means the call did not happen at
   * all — an offline phone, or a build pointed at a database that has not had
   * `0016_club_membership.sql` applied yet. Either way the people who are already members have to
   * keep seeing their club, and failing the tab over a best-effort join would take it away from
   * everybody in order to fix it for one person.
   */
  const loaded = useLoader<MyMarathon[]>(
    async () => {
      await joinClub().catch(() => null);
      return listMyMarathons();
    },
    [],
    [],
  );
  /*
   * The club wins over any other running round.
   *
   * Two can be live at once — the club, and a closed cohort the coach is running by hand — and
   * «the first active one» handed a member whichever started later. `my_marathons()` already sorts
   * the club first, so this is belt and braces against a database that has not had 0016 applied.
   */
  const active =
    loaded.data.find((m) => m.isClub && m.status === 'active') ??
    loaded.data.find((m) => m.status === 'active') ??
    loaded.data[0] ??
    null;
  const club = (duo: boolean) =>
    loaded.data.find((m) => m.isClub && m.status === 'active' && m.teamSize > 1 === duo) ?? null;
  return { ...loaded, marathon: active, soloClub: club(false), duoClub: club(true) };
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

/** My own days of a round, newest first. `version` re-reads it (after a proof is sent). */
export function useMarathonMyPoints(
  marathonId: string | null,
  version = 0,
): Loaded<MarathonDayPoints[]> {
  return useLoader<MarathonDayPoints[]>(
    () => (marathonId ? getMarathonMyPoints(marathonId) : Promise.resolve([])),
    [],
    [marathonId, version],
  );
}

export function useMarathonRoster(marathonId: string | null): Loaded<MarathonRosterRow[]> {
  return useLoader<MarathonRosterRow[]>(
    () => (marathonId ? getMarathonRoster(marathonId) : Promise.resolve([])),
    [],
    [marathonId],
  );
}
