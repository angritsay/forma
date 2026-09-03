import { describe, expect, it } from 'vitest';
import { COURSES } from '@/content/registry';
import type { LeaderboardRow } from '@/lib/api/types';
import { podiumPlace, resolveCourseParam, splitLeaderboard } from './model';

function row(rank: number, points: number, isMe = false): LeaderboardRow {
  return {
    userId: `user-${String(rank).padStart(3, '0')}`,
    displayName: `Athlete ${rank}`,
    avatarSeed: `seed-${rank}`,
    points,
    rank,
    isMe,
  };
}

describe('resolveCourseParam', () => {
  const id = COURSES[0]!.id;
  it('accepts an owned, existing course and falls back to global otherwise', () => {
    expect(resolveCourseParam(id, [id])).toBe(id);
    expect(resolveCourseParam(id, [])).toBeNull();
    expect(resolveCourseParam('nope', ['nope'])).toBeNull();
    expect(resolveCourseParam(null, [id])).toBeNull();
    expect(resolveCourseParam('', [id])).toBeNull();
  });
});

describe('splitLeaderboard', () => {
  it('keeps the own row inside the list when it is in the top', () => {
    const view = splitLeaderboard([row(3, 50, true), row(1, 100), row(2, 80)], 100);
    expect(view.top.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(view.me?.rank).toBe(3);
    expect(view.pinned).toBe(false);
    expect(view.empty).toBe(false);
  });

  it('pins the own row when it is beyond the limit', () => {
    const rows = [row(1, 100), row(2, 90), row(3, 80), row(57, 5, true)];
    const view = splitLeaderboard(rows, 3);
    expect(view.top.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(view.pinned).toBe(true);
    expect(view.me?.rank).toBe(57);
  });

  it('shows an unranked caller (0 points, last place) at the bottom of a short list', () => {
    const view = splitLeaderboard([row(1, 100), row(2, 60), row(3, 0, true)], 100);
    expect(view.top.map((r) => r.points)).toEqual([100, 60, 0]);
    expect(view.pinned).toBe(false);
    expect(view.empty).toBe(false);
  });

  it('is empty when nobody has scored', () => {
    const view = splitLeaderboard([row(1, 0, true)], 100);
    expect(view.empty).toBe(true);
    expect(view.top).toEqual([]);
    expect(view.me?.isMe).toBe(true);
  });
});

describe('podiumPlace', () => {
  it('returns the place for ranks 1–3 only', () => {
    expect(podiumPlace(1)).toBe(1);
    expect(podiumPlace(3)).toBe(3);
    expect(podiumPlace(4)).toBeNull();
    expect(podiumPlace(0)).toBeNull();
  });
});
