/**
 * The marathon scoring rules, in TypeScript.
 *
 * The authority is `marathon_scores()` in supabase/migrations/0011_marathon.sql — that is what the
 * real board is computed from, and nothing here is ever consulted when a Supabase project is
 * configured. This exists for two reasons: demo mode has no database and still has to show a board
 * that behaves, and the rules deserve to be stated once in a language the app's tests can read.
 *
 * Keeping the two in step is the point of score.test.ts: it scores the exact fixture that
 * supabase/tests/40_marathon.sql scores, and asserts the same three totals. If the SQL changes and
 * this does not, those numbers part company and the test says so.
 *
 * The idea the whole thing rests on: an *entry* is what races. A team is an entry; a member with no
 * team is their own entry of one. That is why `all_members` needs no special case for someone
 * playing alone — a team of one is satisfied by one person.
 */
import type { MarathonRule, MarathonTaskTarget } from '@/lib/api/types';

/** The part of a task that decides points. */
export interface ScorableTask {
  id: string;
  dayIndex: number;
  rule: MarathonRule;
  points: number;
  cap: number | null;
  /** Who it was sent to. Empty means everyone. */
  targets: readonly MarathonTaskTarget[];
}

/** A proof that has been checked for lateness and voiding already — see {@link countsFor}. */
export interface CountedProof {
  taskId: string;
  memberId: string;
}

/** One racer: a team, or a lone member standing in for one. */
export interface ScorableEntry {
  id: string;
  kind: 'team' | 'solo';
  memberIds: string[];
  /** The team every member of this entry is on, when it is a team. */
  teamId?: string | null;
}

/** Week 1 is days 1–7, counted from the marathon's own start rather than from Monday. */
export function weekOf(dayIndex: number): number {
  return dayIndex < 1 ? 0 : Math.floor((dayIndex - 1) / 7) + 1;
}

/**
 * Was this task sent to this person?
 *
 * No targets at all means everyone; otherwise they are named, or their team is. This replaced an
 * audience category, and it is why the rules below read the same for a task sent to the whole
 * marathon and one sent to a single person: a rule always applies over *the recipients*.
 */
export function isRecipient(
  task: Pick<ScorableTask, 'targets'>,
  memberId: string,
  teamId: string | null | undefined,
): boolean {
  if (task.targets.length === 0) return true;
  return task.targets.some(
    (g) => g.memberId === memberId || (g.teamId !== null && g.teamId === teamId),
  );
}

/** The members of an entry a task was sent to. */
export function recipientsIn(task: Pick<ScorableTask, 'targets'>, entry: ScorableEntry): string[] {
  return entry.memberIds.filter((id) => isRecipient(task, id, entry.teamId ?? null));
}

/**
 * What one entry takes for one task, given how many of its members delivered.
 *
 *   all_members  everyone it was sent to, or nothing — the rule a pair is built on
 *   per_member   every recipient who delivered earns
 *   capped       per_member, with a ceiling on the entry's total
 *   none         the morning message: never scores
 *
 * `asked` is how many members of this entry the task went to — the whole entry for a task sent to
 * everybody, one person for a task sent to one person.
 */
export function scoreTask(task: ScorableTask, done: number, asked: number): number {
  switch (task.rule) {
    case 'all_members':
      return asked > 0 && done >= asked ? task.points : 0;
    case 'per_member':
      return done * task.points;
    case 'capped':
      return Math.min(done * task.points, task.cap ?? 0);
    case 'none':
      return 0;
  }
}

/**
 * Whether a proof counts towards the score: not struck out, and in time unless the task forgives
 * lateness. The deadline is the marathon's, so the caller passes the instant the day closed.
 */
export function countsFor(
  proof: { submittedAt: string; voidedAt: string | null },
  deadline: Date,
  lateCounts: boolean,
): boolean {
  if (proof.voidedAt) return false;
  return lateCounts || new Date(proof.submittedAt).getTime() <= deadline.getTime();
}

/**
 * When a given day closes, as an instant.
 *
 * `startsOn` is a plain YYYY-MM-DD and `dueTime` an HH:MM(:SS) wall clock in the marathon's own
 * zone, so this walks through `Intl` rather than `Date.parse`: a marathon run from Moscow must
 * close at 22:00 Moscow for a member sitting in Lisbon, and the browser's own offset has no say.
 */
export function deadlineFor(
  startsOn: string,
  dayIndex: number,
  dueTime: string,
  timezone: string,
): Date {
  const [y, m, d] = ymd(startsOn);
  const day = new Date(Date.UTC(y, m - 1, d + (dayIndex - 1)));
  const [hh, mm] = hhmm(dueTime);
  const wallUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hh, mm, 0);
  return new Date(wallUtc - zoneOffsetMs(new Date(wallUtc), timezone));
}

/** `YYYY-MM-DD` as numbers. A malformed date falls back to the epoch rather than to NaN. */
function ymd(iso: string): [number, number, number] {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return [y, m, d];
}

/** `HH:MM` or `HH:MM:SS` as numbers; Postgres sends the seconds, forms usually do not. */
function hhmm(time: string): [number, number] {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return [h, m];
}

/** How far the named zone is ahead of UTC at that instant, in milliseconds. */
function zoneOffsetMs(at: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // `hour` comes back as 24 at midnight under hour12:false in some engines.
  const hour = get('hour') % 24;
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    hour,
    get('minute'),
    get('second'),
  );
  return asUtc - at.getTime();
}

/** Which day of the marathon it is in the marathon's own zone. 0 before it starts. */
export function dayIndexOf(startsOn: string, timezone: string, now: Date = new Date()): number {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const [ty, tm, td] = ymd(today);
  const [sy, sm, sd] = ymd(startsOn);
  const diff = (Date.UTC(ty, tm - 1, td) - Date.UTC(sy, sm - 1, sd)) / 86_400_000;
  return Math.max(0, diff + 1);
}

export interface BoardRow {
  entryKind: 'team' | 'solo';
  entryId: string;
  points: number;
  rank: number;
}

/**
 * The board for one week: every entry's points, ranked. Ties share a rank, as they do in SQL.
 *
 * `counted` has already been filtered by {@link countsFor} — this function does arithmetic, not
 * policy, so that the rules above can be tested one at a time.
 */
export function board(
  entries: ScorableEntry[],
  tasks: ScorableTask[],
  counted: CountedProof[],
  week: number,
  adjustments: { memberId: string; dayIndex: number; points: number }[] = [],
): BoardRow[] {
  const weekTasks = tasks.filter((t) => weekOf(t.dayIndex) === week);
  const totals = entries.map((entry) => {
    const fromTasks = weekTasks.reduce((sum, task) => {
      const asked = recipientsIn(task, entry);
      if (asked.length === 0) return sum;
      const done = counted.filter((c) => c.taskId === task.id && asked.includes(c.memberId)).length;
      return sum + scoreTask(task, done, asked.length);
    }, 0);
    const fromCoach = adjustments
      .filter((a) => weekOf(a.dayIndex) === week && entry.memberIds.includes(a.memberId))
      .reduce((sum, a) => sum + a.points, 0);
    return { entry, points: Math.max(fromTasks + fromCoach, 0) };
  });

  totals.sort((a, b) => b.points - a.points || a.entry.id.localeCompare(b.entry.id));
  return totals.map((t) => ({
    entryKind: t.entry.kind,
    entryId: t.entry.id,
    points: t.points,
    // Equal totals share a rank: two pairs on 20 are both second, and the next is fourth.
    rank: 1 + totals.findIndex((o) => o.points === t.points),
  }));
}
