/**
 * The arithmetic behind the club tools (0047): which days a week is, which day of the other club
 * falls on the same date, who is paired with whom, and what a server refusal means in words.
 *
 * Kept out of the components so it can be tested without rendering anything — every one of these
 * is a place an off-by-one would copy the wrong week onto a club members pay to read.
 */
import type { TKey } from '@/i18n/index';
import { weekOf } from '@/lib/marathon/score';
import type { MarathonMemberRow, MarathonRow, MarathonTeamRow } from '@/lib/api/types';
import { dateOfDay, dayOfDate } from './dates';

/** Days of week `week` of a round: day 1..7 is week 1. Clamped to the round's last day. */
export function weekRange(
  week: number,
  days: number,
): { fromDay: number; dayCount: number } | null {
  if (!Number.isInteger(week) || week < 1) return null;
  const fromDay = (week - 1) * 7 + 1;
  if (fromDay > days) return null;
  return { fromDay, dayCount: Math.min(7, days - fromDay + 1) };
}

/** The week a day is in — the same buckets as `marathon_week_of()`. */
export const weekOfDay = weekOf;

/**
 * The weeks a week can be copied to: every later week up to `ahead` of them, never past the round.
 * The first one — the next week — is the default, because that is the Sunday-evening question.
 */
export function copyTargetWeeks(fromWeek: number, days: number, ahead = 8): number[] {
  const last = weekOf(days);
  const out: number[] = [];
  for (let w = fromWeek + 1; w <= last && out.length < ahead; w += 1) out.push(w);
  return out;
}

/**
 * Week `fromWeek` onto week `toWeek` of the same round, clamped so both ends stay inside it.
 * Null when there is nothing to copy — a week past the end, or a week onto itself.
 */
export function weekCopyRange(
  fromWeek: number,
  toWeek: number,
  days: number,
): { fromDay: number; toDay: number; dayCount: number } | null {
  if (fromWeek === toWeek) return null;
  const from = weekRange(fromWeek, days);
  const to = weekRange(toWeek, days);
  if (!from || !to) return null;
  return {
    fromDay: from.fromDay,
    toDay: to.fromDay,
    dayCount: Math.min(from.dayCount, to.dayCount),
  };
}

/**
 * The same dates in the other club. The two clubs can start on different Mondays, so «the same
 * week» is the same calendar dates, not the same day numbers. Days before the other club began
 * or after it ends are trimmed off the range; null when none are left.
 */
export function crossClubRange(
  from: Pick<MarathonRow, 'startsOn' | 'days'>,
  to: Pick<MarathonRow, 'startsOn' | 'days'>,
  fromDay: number,
  dayCount: number,
): { fromDay: number; toDay: number; dayCount: number } | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < dayCount; i += 1) {
    const src = fromDay + i;
    if (src < 1 || src > from.days) continue;
    const dst = dayOfDate(to.startsOn, to.days, dateOfDay(from.startsOn, src));
    if (dst < 1) continue;
    if (first < 0) first = i;
    last = i;
  }
  if (first < 0) return null;
  const start = fromDay + first;
  return {
    fromDay: start,
    toDay: dayOfDate(to.startsOn, to.days, dateOfDay(from.startsOn, start)),
    dayCount: last - first + 1,
  };
}

/** The other live club: the duo one from a solo round, the solo one from a duo round. */
export function otherLiveClub(
  current: Pick<MarathonRow, 'id' | 'teamSize' | 'isClub'>,
  all: readonly MarathonRow[],
): MarathonRow | null {
  if (!current.isClub) return null;
  const duo = current.teamSize > 1;
  return (
    all.find(
      (m) => m.id !== current.id && m.isClub && m.status === 'active' && m.teamSize > 1 !== duo,
    ) ?? null
  );
}

/** The live clubs, for the badges on the list of rounds. */
export function liveClubs(all: readonly MarathonRow[]): {
  solo: string | null;
  duo: string | null;
} {
  const pick = (duo: boolean) =>
    all.find((m) => m.isClub && m.status === 'active' && m.teamSize > 1 === duo)?.id ?? null;
  return { solo: pick(false), duo: pick(true) };
}

export interface DuoPair {
  team: MarathonTeamRow;
  members: MarathonMemberRow[];
}

/**
 * The duo club as pairs and people without one. Only active members count: someone removed from
 * the club is not a partner anyone has, and not someone to pair.
 */
export function duoPeople(
  members: readonly MarathonMemberRow[],
  teams: readonly MarathonTeamRow[],
): { pairs: DuoPair[]; unpaired: MarathonMemberRow[] } {
  const active = members.filter((m) => m.status === 'active');
  const byTeam = new Map<string, MarathonMemberRow[]>();
  const unpaired: MarathonMemberRow[] = [];
  const known = new Set(teams.map((t) => t.id));
  for (const m of active) {
    if (m.teamId && known.has(m.teamId)) {
      const list = byTeam.get(m.teamId) ?? [];
      list.push(m);
      byTeam.set(m.teamId, list);
    } else {
      unpaired.push(m);
    }
  }
  const pairs = teams
    .filter((t) => (byTeam.get(t.id)?.length ?? 0) > 0)
    .map((team) => ({ team, members: byTeam.get(team.id) ?? [] }));
  return { pairs, unpaired };
}

/** A person as the coach reads them: the name she gave, or the address. */
export function personName(m: Pick<MarathonMemberRow, 'displayName' | 'email'>): string {
  return m.displayName?.trim() || m.email;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `?proof=<id>` — the deep link the Telegram «Пруф прислали заново» message opens. Anything that
 * is not a uuid is ignored rather than sent to the server.
 */
export function proofIdFromSearch(search: URLSearchParams | string): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const id = params.get('proof')?.trim() ?? '';
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}

/** A server refusal from the club tools, in the owner's words. */
export function clubErrorKey(error: unknown): TKey {
  const message = error instanceof Error ? error.message : String(error ?? '');
  switch (message) {
    case 'overlap':
      return 'app.clubErrOverlap';
    case 'out_of_range':
    case 'invalid_range':
      return 'app.clubErrOutOfRange';
    case 'already_paired':
      return 'app.clubErrAlreadyPaired';
    case 'member_not_in_club':
    case 'need_two_members':
      return 'app.clubErrNotInClub';
    case 'no_club':
      return 'app.clubErrNoClub';
    case 'mode_mismatch':
      return 'app.clubErrModeMismatch';
    case 'team_not_found':
      return 'app.clubErrTeamGone';
    default:
      return 'app.mAdminSaveError';
  }
}
