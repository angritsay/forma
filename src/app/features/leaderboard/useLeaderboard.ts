/** Fetches `get_leaderboard` for a period / course and exposes a reload; stale responses are dropped. */
import { useCallback, useEffect, useState } from 'react';
import { toAppError, type AppError } from '@/lib/api/errors';
import { getLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardPeriod, LeaderboardRow } from '@/lib/api/types';
import { LEADERBOARD_LIMIT } from './model';

export type LeaderboardStatus = 'loading' | 'ready' | 'error';

export interface LeaderboardState {
  rows: LeaderboardRow[];
  status: LeaderboardStatus;
  error: AppError | null;
  reload: () => void;
}

export function useLeaderboard(
  period: LeaderboardPeriod,
  courseId: string | null,
): LeaderboardState {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [status, setStatus] = useState<LeaderboardStatus>('loading');
  const [error, setError] = useState<AppError | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setError(null);
    getLeaderboard(period, courseId ?? undefined, LEADERBOARD_LIMIT)
      .then((data) => {
        if (!alive) return;
        setRows(data);
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
  }, [period, courseId, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { rows, status, error, reload };
}
