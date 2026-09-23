import { describe, expect, it } from 'vitest';
import type { MarathonMemberRow, MarathonRow, MarathonTeamRow } from '@/lib/api/types';
import {
  clubErrorKey,
  copyTargetWeeks,
  crossClubRange,
  duoPeople,
  liveClubs,
  otherLiveClub,
  proofIdFromSearch,
  weekCopyRange,
  weekRange,
} from './clubTools';

const round = (over: Partial<MarathonRow>): MarathonRow => ({
  id: 'r',
  slug: 'r',
  title: 'Круг',
  titleEn: null,
  description: null,
  descriptionEn: null,
  status: 'active',
  startsOn: '2026-09-21',
  days: 3650,
  teamSize: 1,
  timezone: 'Europe/Moscow',
  dueTime: '22:00:00',
  prize: null,
  prizeEn: null,
  createdAt: '',
  updatedAt: '',
  isClub: false,
  ...over,
});

const member = (id: string, teamId: string | null, status: 'active' | 'removed' = 'active') =>
  ({
    id,
    marathonId: 'duo',
    email: `${id}@example.com`,
    teamId,
    displayName: null,
    status,
    note: null,
    createdAt: '',
  }) satisfies MarathonMemberRow;

describe('weekRange', () => {
  it('is days 1–7 for week 1 and 8–14 for week 2', () => {
    expect(weekRange(1, 28)).toEqual({ fromDay: 1, dayCount: 7 });
    expect(weekRange(2, 28)).toEqual({ fromDay: 8, dayCount: 7 });
  });
  it('clamps the last week to the round and refuses weeks outside it', () => {
    expect(weekRange(4, 24)).toEqual({ fromDay: 22, dayCount: 3 });
    expect(weekRange(5, 28)).toBeNull();
    expect(weekRange(0, 28)).toBeNull();
    expect(weekRange(1.5, 28)).toBeNull();
  });
});

describe('copyTargetWeeks', () => {
  it('offers the following weeks, next one first, never past the round', () => {
    expect(copyTargetWeeks(2, 28)).toEqual([3, 4]);
    expect(copyTargetWeeks(4, 28)).toEqual([]);
    expect(copyTargetWeeks(1, 3650, 3)).toEqual([2, 3, 4]);
  });
});

describe('weekCopyRange', () => {
  it('copies week W onto week W+1 day for day', () => {
    expect(weekCopyRange(3, 4, 3650)).toEqual({ fromDay: 15, toDay: 22, dayCount: 7 });
  });
  it('shortens to the shorter week at the end of a round', () => {
    expect(weekCopyRange(3, 4, 24)).toEqual({ fromDay: 15, toDay: 22, dayCount: 3 });
  });
  it('refuses a week onto itself or outside the round', () => {
    expect(weekCopyRange(2, 2, 28)).toBeNull();
    expect(weekCopyRange(2, 9, 28)).toBeNull();
  });
});

describe('crossClubRange', () => {
  it('maps the same dates when both clubs start the same Monday', () => {
    const solo = round({ startsOn: '2026-09-21' });
    const duo = round({ startsOn: '2026-09-21' });
    expect(crossClubRange(solo, duo, 8, 7)).toEqual({ fromDay: 8, toDay: 8, dayCount: 7 });
  });
  it('shifts by the difference in start dates', () => {
    const solo = round({ startsOn: '2026-09-07' });
    const duo = round({ startsOn: '2026-09-21' });
    // Solo day 15 is 2026-09-21, which is duo day 1.
    expect(crossClubRange(solo, duo, 15, 7)).toEqual({ fromDay: 15, toDay: 1, dayCount: 7 });
  });
  it('trims the days before the other club began', () => {
    const solo = round({ startsOn: '2026-09-21' });
    const duo = round({ startsOn: '2026-09-24' });
    // Days 1–3 are before the duo club; 4–7 land on duo days 1–4.
    expect(crossClubRange(solo, duo, 1, 7)).toEqual({ fromDay: 4, toDay: 1, dayCount: 4 });
  });
  it('is null when no date exists in the other club', () => {
    const solo = round({ startsOn: '2026-09-21' });
    const duo = round({ startsOn: '2026-12-01', days: 28 });
    expect(crossClubRange(solo, duo, 1, 7)).toBeNull();
  });
});

describe('live clubs', () => {
  const solo = round({ id: 's', isClub: true, teamSize: 1 });
  const duo = round({ id: 'd', isClub: true, teamSize: 2 });
  const draft = round({ id: 'x', teamSize: 2, status: 'draft' });
  it('finds the live club of each mode', () => {
    expect(liveClubs([draft, solo, duo])).toEqual({ solo: 's', duo: 'd' });
    expect(liveClubs([draft])).toEqual({ solo: null, duo: null });
  });
  it('finds the other live club only from a live club', () => {
    expect(otherLiveClub(solo, [solo, duo, draft])?.id).toBe('d');
    expect(otherLiveClub(duo, [solo, duo, draft])?.id).toBe('s');
    expect(otherLiveClub(draft, [solo, duo, draft])).toBeNull();
    expect(otherLiveClub(solo, [solo, { ...duo, status: 'finished' }])).toBeNull();
  });
});

describe('duoPeople', () => {
  const teams: MarathonTeamRow[] = [
    { id: 't1', marathonId: 'duo', name: 'A и B', sortOrder: 0, isAuto: true },
    { id: 't2', marathonId: 'duo', name: 'пустая', sortOrder: 1, isAuto: false },
  ];
  it('groups active members by pair and lists the rest as unpaired', () => {
    const { pairs, unpaired } = duoPeople(
      [
        member('a', 't1'),
        member('b', 't1'),
        member('c', null),
        member('d', 'gone'),
        member('e', null, 'removed'),
      ],
      teams,
    );
    expect(pairs).toHaveLength(1);
    expect(pairs[0]?.team.id).toBe('t1');
    expect(pairs[0]?.members.map((m) => m.id)).toEqual(['a', 'b']);
    // A team id that no longer exists is no pair; a removed member is nobody's.
    expect(unpaired.map((m) => m.id)).toEqual(['c', 'd']);
  });
});

describe('proofIdFromSearch', () => {
  const id = '0b7c9a2e-1f3d-4a5b-8c6d-7e8f9a0b1c2d';
  it('reads a uuid from ?proof=', () => {
    expect(proofIdFromSearch(`?proof=${id}`)).toBe(id);
    expect(proofIdFromSearch(new URLSearchParams({ proof: id.toUpperCase() }))).toBe(id);
  });
  it('ignores anything else', () => {
    expect(proofIdFromSearch('')).toBeNull();
    expect(proofIdFromSearch('?proof=abc')).toBeNull();
    expect(proofIdFromSearch("?proof=1' or 1=1")).toBeNull();
  });
});

describe('clubErrorKey', () => {
  it('turns server codes into words', () => {
    expect(clubErrorKey(new Error('already_paired'))).toBe('app.clubErrAlreadyPaired');
    expect(clubErrorKey(new Error('overlap'))).toBe('app.clubErrOverlap');
    expect(clubErrorKey(new Error('out_of_range'))).toBe('app.clubErrOutOfRange');
    expect(clubErrorKey(new Error('mode_mismatch'))).toBe('app.clubErrModeMismatch');
    expect(clubErrorKey(new Error('no_club'))).toBe('app.clubErrNoClub');
  });
  it('falls back to the generic save error', () => {
    expect(clubErrorKey(new Error('boom'))).toBe('app.mAdminSaveError');
    expect(clubErrorKey(null)).toBe('app.mAdminSaveError');
  });
});
