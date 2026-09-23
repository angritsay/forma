/**
 * Who the coach announced for one week of one round, and the one action that changes it.
 *
 * Shared by the «Доска» tab of the club admin and anything else that announces from a board. It
 * reports failure instead of swallowing it: the caller decides how to say so (a toast in the
 * admin), and the state it holds is re-read from the database after every write, so the row
 * with the cup is always the one the server has.
 */
import { useCallback, useEffect, useState } from 'react';
import { getMarathonWinner, setMarathonWinner } from '@/lib/api/marathonAdmin';
import type { MarathonWinner } from '@/lib/api/types';
import { nextWinner } from './dates';

export interface WeekWinner {
  winner: MarathonWinner | null;
  /** True until the first read for this week has come back. */
  loading: boolean;
  /**
   * Announce `memberId` — or withdraw the announcement when it is the one already announced.
   * Resolves to what the week now has; rejects when the write failed (nothing changed).
   */
  toggle: (memberId: string) => Promise<MarathonWinner | null>;
}

export function useWeekWinner(marathonId: string | null, week: number | null): WeekWinner {
  const [winner, setWinner] = useState<MarathonWinner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marathonId || !week) return;
    let alive = true;
    setLoading(true);
    getMarathonWinner(marathonId, week)
      .then((w) => {
        if (alive) setWinner(w);
      })
      .catch(() => {
        if (alive) setWinner(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [marathonId, week]);

  const toggle = useCallback(
    async (memberId: string) => {
      if (!marathonId || !week) return winner;
      await setMarathonWinner(marathonId, week, nextWinner(winner?.memberId, memberId));
      const fresh = await getMarathonWinner(marathonId, week);
      setWinner(fresh);
      return fresh;
    },
    [marathonId, week, winner],
  );

  return { winner, loading, toggle };
}
