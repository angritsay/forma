/**
 * Pure helpers for the leaderboard: which course the URL asks for, and how the RPC rows split
 * into the top list and the athlete's own row (pinned when outside the top).
 */
import { COURSE_BY_ID } from '@/content/registry';
import type { LeaderboardRow } from '@/lib/api/types';

export const LEADERBOARD_LIMIT = 100;

/** The `course` query parameter, when it names a course the athlete owns; else the global table. */
export function resolveCourseParam(
  param: string | null | undefined,
  owned: readonly string[],
): string | null {
  if (!param || !COURSE_BY_ID.has(param) || !owned.includes(param)) return null;
  return param;
}

export interface LeaderboardView {
  /** Ranked athletes with points (the caller's own row included when it is in the top). */
  top: LeaderboardRow[];
  me: LeaderboardRow | null;
  /** The caller is outside the top list: show `me` pinned at the bottom. */
  pinned: boolean;
  /** Nobody has points for this period / course yet. */
  empty: boolean;
}

/**
 * `get_leaderboard` returns the top N plus the caller's row (0 points and last rank when the
 * caller has not scored). Rows are sorted by rank; the caller's row is pinned when it falls
 * beyond `limit`.
 */
export function splitLeaderboard(
  rows: readonly LeaderboardRow[],
  limit = LEADERBOARD_LIMIT,
): LeaderboardView {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank || a.userId.localeCompare(b.userId));
  const meIndex = sorted.findIndex((r) => r.isMe);
  const me = meIndex >= 0 ? (sorted[meIndex] ?? null) : null;
  const pinned = meIndex >= limit;
  const top = sorted.slice(0, limit).filter((r) => r.points > 0 || (r.isMe && !pinned));
  const empty = !top.some((r) => r.points > 0);
  return { top: empty ? [] : top, me, pinned, empty };
}

export type Podium = 1 | 2 | 3;

/** Podium place for the first three ranks, null otherwise. */
export function podiumPlace(rank: number): Podium | null {
  return rank === 1 || rank === 2 || rank === 3 ? rank : null;
}
