/**
 * The marathon, as an athlete sees it: which runs I am in, today's tasks, my proof, the board.
 *
 * Everything the coach does lives in marathonAdmin.ts. The split is not cosmetic — these are the
 * only marathon calls a normal member is allowed to make, and row-level security agrees with the
 * split, so keeping them apart makes it obvious when a screen reaches for the wrong half.
 *
 * Four of the reads are RPCs rather than table queries (`my_marathons`, `marathon_roster`,
 * `marathon_scores`, `marathon_my_points`) because each has to see rows the caller has no policy
 * on, or do arithmetic that must come out identical for everybody. See 0011_marathon.sql.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type {
  ClubDuoStatus,
  ClubWinner,
  MarathonDayPoints,
  MarathonRosterRow,
  MarathonScoreRow,
  MarathonSubmissionRow,
  MarathonTaskRow,
  MarathonTodayTask,
  MyMarathon,
  ProofInput,
} from './types';

// --- row mapping -------------------------------------------------------------

interface DbMyMarathon {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: MyMarathon['status'];
  starts_on: string;
  days: number;
  team_size: number;
  prize: string | null;
  day_index: number;
  week: number | null;
  total_weeks: number | null;
  member_id: string;
  team_id: string | null;
  team_name: string | null;
  is_club?: boolean;
}

export interface DbMarathonTask {
  id: string;
  marathon_id: string;
  day_index: number;
  sort_order: number;
  title: string;
  title_en: string | null;
  body: string | null;
  body_en: string | null;
  media_url: string | null;
  proof_kind: MarathonTaskRow['proofKind'];
  unit: string | null;
  target_num: number | string | null;
  rule: MarathonTaskRow['rule'];
  points: number;
  cap: number | null;
  proof_visibility: MarathonTaskRow['proofVisibility'];
  due_time: string | null;
  late_counts: boolean;
}

export interface DbMarathonSubmission {
  id: string;
  task_id: string;
  member_id: string;
  marathon_id: string;
  day_index: number;
  value_text: string | null;
  value_num: number | string | null;
  media_path: string | null;
  submitted_at: string;
  voided_at: string | null;
  void_reason: string | null;
  // 0025. Optional on the wire: a database without that migration returns no such column, and the
  // club must keep working there — every proof simply reads as a first attempt nobody has reviewed.
  attempt?: number | null;
  resubmitted_at?: string | null;
  reviewed_at?: string | null;
}

/** numeric(10,2) arrives from PostgREST as a string. */
const num = (v: number | string | null): number | null =>
  v === null || v === '' ? null : typeof v === 'number' ? v : Number(v);

export function taskFromDb(r: DbMarathonTask): MarathonTaskRow {
  return {
    id: r.id,
    marathonId: r.marathon_id,
    dayIndex: r.day_index,
    sortOrder: r.sort_order,
    title: r.title,
    titleEn: r.title_en ?? null,
    body: r.body,
    bodyEn: r.body_en ?? null,
    mediaUrl: r.media_url,
    proofKind: r.proof_kind,
    unit: r.unit,
    targetNum: num(r.target_num),
    rule: r.rule,
    points: r.points,
    cap: r.cap,
    proofVisibility: r.proof_visibility,
    dueTime: r.due_time,
    lateCounts: r.late_counts,
  };
}

export function submissionFromDb(r: DbMarathonSubmission): MarathonSubmissionRow {
  return {
    id: r.id,
    taskId: r.task_id,
    memberId: r.member_id,
    marathonId: r.marathon_id,
    dayIndex: r.day_index,
    valueText: r.value_text,
    valueNum: num(r.value_num),
    mediaPath: r.media_path,
    submittedAt: r.submitted_at,
    voidedAt: r.voided_at,
    voidReason: r.void_reason,
    attempt: r.attempt ?? 1,
    resubmittedAt: r.resubmitted_at ?? null,
    reviewedAt: r.reviewed_at ?? null,
  };
}

function myMarathonFromDb(r: DbMyMarathon): MyMarathon {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    status: r.status,
    startsOn: r.starts_on,
    days: r.days,
    teamSize: r.team_size,
    prize: r.prize,
    dayIndex: r.day_index,
    week: r.week ?? 1,
    totalWeeks: r.total_weeks ?? 1,
    memberId: r.member_id,
    teamId: r.team_id,
    teamName: r.team_name,
    // Optional on the wire: a database that has not had 0016 applied yet returns no such column,
    // and the tab must keep working there — it simply falls back to picking by start date.
    isClub: r.is_club === true,
  };
}

export const TASK_COLS = '*';

// --- reads -------------------------------------------------------------------

/**
 * Put the signed-in athlete into the club, if what they pay for entitles them to be there.
 *
 * **Paying is the membership** — «Если ты в клубе то ты участвуешь. Если нет то нет.» Until this
 * existed a subscriber opened the tab and got the sales screen with «Ты в клубе» written on it and
 * nothing under it: `my_marathons()` looks for a row in `marathon_members`, and the only thing that
 * wrote one was a workflow reading a list of addresses out of a repository secret. That is how a
 * closed cohort is filled, and a club is not one.
 *
 * **The entitlement is checked in the database** (`club_access()`), never here. This call is a
 * request rather than an instruction: an RPC that took the caller's word for it would be a paywall
 * anybody signed in could step through by calling it. `null` comes back when there is no club
 * running or no entitlement, and neither of those is an error.
 *
 * Idempotent, so it is safe to call on every open of the tab.
 */
export async function joinClub(): Promise<string | null> {
  if (isDemo()) return (await demo()).joinClub();
  return guard(async () => {
    await requireUser();
    return unwrap<string | null>(await supabase().rpc('join_club'));
  });
}

/**
 * The dates the athlete has an un-voided club proof for, newest first, across every round.
 *
 * The streak is computed from this list rather than by the server — see
 * `src/app/features/marathon/streak.ts` for why the rule lives in one place, and
 * `supabase/migrations/0023_club_days.sql` for why the date is the day the task was *for* rather
 * than the moment the button was pressed.
 *
 * `today` is the athlete's own local date, not the server's: a streak that turned over at midnight
 * UTC would break at three in the morning in Moscow and at four in the afternoon in Vladivostok.
 */
export async function getMyClubDays(today: string): Promise<string[]> {
  if (isDemo()) return (await demo()).getMyClubDays(today);
  return guard(async () => {
    await requireUser();
    return unwrap<string[]>(await supabase().rpc('my_club_days', { p_today: today }));
  });
}

/** Every marathon the signed-in athlete plays, newest first. Drafts are not theirs to see. */
export async function listMyMarathons(): Promise<MyMarathon[]> {
  if (isDemo()) return (await demo()).listMyMarathons();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<DbMyMarathon[]>(await supabase().rpc('my_marathons'));
    return rows.map(myMarathonFromDb);
  });
}

/** Who else is playing, by name. The roster never carries an email. */
export async function getMarathonRoster(marathonId: string): Promise<MarathonRosterRow[]> {
  if (isDemo()) return (await demo()).getMarathonRoster(marathonId);
  return guard(async () => {
    const rows = unwrap<
      {
        member_id: string;
        display_name: string;
        team_id: string | null;
        team_name: string | null;
        is_me: boolean;
      }[]
    >(await supabase().rpc('marathon_roster', { p_marathon_id: marathonId }));
    return rows.map((r) => ({
      memberId: r.member_id,
      displayName: r.display_name,
      teamId: r.team_id,
      teamName: r.team_name,
      isMe: r.is_me,
    }));
  });
}

/**
 * One day of a marathon, as the Today screen needs it: the tasks I was sent, my own proof against
 * each, and which of the people I am scored with have already delivered.
 *
 * No filtering here on who a task was for — row-level security does that, so a task the coach
 * addressed to another pair never reaches this client at all.
 *
 * The partner state is the reason this is one function rather than three calls in the screen — the
 * whole tension of a paired marathon is «Ваня сделал, ждём Витю», and that sentence needs the task,
 * my submission and my teammates' in the same breath.
 */
export async function getMarathonDay(
  marathon: MyMarathon,
  dayIndex: number,
): Promise<MarathonTodayTask[]> {
  if (isDemo()) return (await demo()).getMarathonDay(marathon, dayIndex);
  return guard(async () => {
    const tasks = unwrap<DbMarathonTask[]>(
      await supabase()
        .from('marathon_tasks')
        .select(TASK_COLS)
        .eq('marathon_id', marathon.id)
        .eq('day_index', dayIndex)
        .order('sort_order', { ascending: true }),
    ).map(taskFromDb);

    const mine = marathon.teamId
      ? (await getMarathonRoster(marathon.id)).filter((r) => r.teamId === marathon.teamId)
      : [{ memberId: marathon.memberId } as MarathonRosterRow];
    const entryIds = new Set(mine.map((r) => r.memberId));

    if (tasks.length === 0) return [];
    const proofs = unwrap<DbMarathonSubmission[]>(
      await supabase()
        .from('marathon_submissions')
        .select('*')
        .in(
          'task_id',
          tasks.map((t) => t.id),
        ),
    ).map(submissionFromDb);

    return tasks.map((task) => {
      const forTask = proofs.filter((p) => p.taskId === task.id);
      return {
        task,
        mine: forTask.find((p) => p.memberId === marathon.memberId) ?? null,
        teammatesDone: forTask
          .filter(
            (p) => p.memberId !== marathon.memberId && entryIds.has(p.memberId) && !p.voidedAt,
          )
          .map((p) => p.memberId),
        entrySize: entryIds.size,
      };
    });
  });
}

/** The board for one week. Omit the week for the current one. */
export async function getMarathonScores(
  marathonId: string,
  week?: number,
): Promise<MarathonScoreRow[]> {
  if (isDemo()) return (await demo()).getMarathonScores(marathonId, week);
  return guard(async () => {
    const rows = unwrap<
      {
        entry_kind: 'team' | 'solo';
        entry_id: string;
        title: string;
        members: string[] | null;
        points: number;
        rank: number;
        is_mine: boolean;
      }[]
    >(
      await supabase().rpc('marathon_scores', {
        p_marathon_id: marathonId,
        p_week: week ?? null,
      }),
    );
    return rows.map((r) => ({
      entryKind: r.entry_kind,
      entryId: r.entry_id,
      title: r.title,
      members: r.members ?? [],
      points: Number(r.points),
      rank: Number(r.rank),
      isMine: r.is_mine,
    }));
  });
}

/** My own marathon day by day: what I delivered, and what my entry took for it. Newest first. */
export async function getMarathonMyPoints(marathonId: string): Promise<MarathonDayPoints[]> {
  if (isDemo()) return (await demo()).getMarathonMyPoints(marathonId);
  return guard(async () => {
    const rows = unwrap<
      { day_index: number; week: number; tasks_total: number; tasks_done: number; points: number }[]
    >(await supabase().rpc('marathon_my_points', { p_marathon_id: marathonId }));
    return rows.map((r) => ({
      dayIndex: r.day_index,
      week: r.week,
      tasksTotal: r.tasks_total,
      tasksDone: r.tasks_done,
      points: Number(r.points),
    }));
  });
}

// --- writes ------------------------------------------------------------------

/**
 * Send proof, correct proof already sent, or do the task again after the coach rejected it. One row
 * per (task, member), so this is an upsert.
 *
 * The day, the marathon and the clock are all the server's: the guard trigger fills them from the
 * task and stamps `submitted_at` itself, which is what stops a phone clock from moving a proof
 * back into a day that has closed. The same trigger reads the row that is already there to tell a
 * correction from a redo, and lifts the rejection on a redo — see 0027_proof_review.sql. Nothing
 * about the verdict is sent from here, because nothing about it is the client's to decide.
 */
export async function sendProof(input: ProofInput): Promise<MarathonSubmissionRow> {
  if (isDemo()) return (await demo()).sendProof(input);
  return guard(async () => {
    await requireUser();
    const row = unwrap<DbMarathonSubmission>(
      await supabase()
        .from('marathon_submissions')
        .upsert(
          {
            task_id: input.taskId,
            member_id: input.memberId,
            // marathon_id and day_index are deliberately not sent: the guard trigger fills them
            // from the task, which is the only source that cannot be argued with.
            value_text: input.valueText ?? null,
            value_num: input.valueNum ?? null,
            media_path: input.mediaPath ?? null,
          },
          { onConflict: 'task_id,member_id' },
        )
        .select('*')
        .single(),
    );
    return submissionFromDb(row);
  });
}

/** Where a proof photo or clip lives. The bucket is private; only its author and the coach read it. */
export function proofMediaPath(
  marathonId: string,
  memberId: string,
  taskId: string,
  ext: string,
): string {
  const safe = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  return `${marathonId}/${memberId}/${taskId}.${safe}`;
}

export const PROOFS_BUCKET = 'proofs';

/**
 * The most recently announced club winner, or null when nobody has been announced yet.
 *
 * The *last announced*, not the current week's: a week that is still running has no winner, and
 * the interesting one on a Monday is whoever won on Sunday. See 0028.
 */
export async function getClubWinner(): Promise<ClubWinner | null> {
  if (isDemo()) return (await demo()).getClubWinner();
  return guard(async () => {
    const rows = unwrap<
      {
        marathon_id: string;
        week: number;
        display_name: string;
        avatar_seed: string;
        note: string | null;
        prize: string | null;
        announced_at: string;
        is_me: boolean;
      }[]
    >(await supabase().rpc('club_winner'));
    const r = rows[0];
    if (!r) return null;
    return {
      marathonId: r.marathon_id,
      week: Number(r.week) || 1,
      displayName: r.display_name,
      avatarSeed: r.avatar_seed ?? '',
      note: r.note,
      prize: r.prize,
      announcedAt: r.announced_at,
      isMe: r.is_me === true,
    };
  });
}

/* ---------------------------------------------------------------------------------------------
 * Дуо-клуб: пара, приглашение, расставание (0033, 0034)
 * ------------------------------------------------------------------------------------------- */

/**
 * Состояние пары одним запросом: есть ли она, кто в ней, сама ли собралась, и какую ссылку
 * показывать, если пары нет.
 *
 * `null` — это не ошибка и почти всегда так и есть: человек без подписки в дуо-круге не состоит,
 * и функция честно не возвращает ни строки. Экран на это рисует предложение вступить, а не сбой.
 *
 * Почты здесь нет ни своей, ни чужой — этого не отдаёт и сама функция. Напарница приходит именем и
 * зерном аватара, то есть ровно тем, чем её рисуют; адрес её знать незачем, а показать случайно
 * было бы можно.
 */
export async function getClubDuoStatus(): Promise<ClubDuoStatus | null> {
  if (isDemo()) return (await demo()).getClubDuoStatus();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<
      {
        marathon_id: string;
        member_id: string;
        team_id: string | null;
        is_auto: boolean;
        mate_name: string | null;
        mate_seed: string | null;
        invite_token: string | null;
      }[]
    >(await supabase().rpc('club_duo_status'));
    const r = rows[0];
    if (!r) return null;
    return {
      marathonId: r.marathon_id,
      memberId: r.member_id,
      teamId: r.team_id,
      isAuto: r.is_auto === true,
      // Имя напарницы приходит только вместе с ней: нет пары — нет и строки.
      mateName: r.team_id && r.mate_name ? r.mate_name : null,
      mateSeed: r.mate_seed ?? '',
      inviteToken: r.invite_token,
    };
  });
}

/**
 * Ссылка-приглашение для подруги. Второй вызов отдаёт тот же токен, что и первый.
 *
 * Это решение базы, а не экрана, и оно важное: «поделиться ссылкой» нажимают по многу раз, и
 * каждая новая ссылка обесценивала бы предыдущую — ту, которую уже отправили в переписке.
 */
export async function createClubInvite(): Promise<string> {
  if (isDemo()) return (await demo()).createClubInvite();
  return guard(async () => {
    await requireUser();
    return unwrap<string>(await supabase().rpc('club_invite_create'));
  });
}

/**
 * Принять приглашение. Возвращает id получившейся пары.
 *
 * Отказы приходят кодами (`no_subscription`, `invite_used`, `invite_expired`, `invite_own`,
 * `inviter_not_in_club`…), и разбирает их экран: каждый из них — это своя фраза человеку, а не
 * «что-то пошло не так». Принятое приглашение расторгает прежние пары обеих сторон — то есть
 * подруга всегда выигрывает у автоподбора, и это тоже решает база.
 */
export async function redeemClubInvite(token: string): Promise<string> {
  if (isDemo()) return (await demo()).redeemClubInvite(token);
  return guard(async () => {
    await requireUser();
    return unwrap<string>(await supabase().rpc('club_invite_redeem', { p_token: token }));
  });
}

/**
 * Расторгнуть пару.
 *
 * Оставшийся без пары попадает в общий котёл и в понедельник получит нового напарника — того же,
 * что все без пары. Отдельного «ушла» состояния нет: пары нет, и всё.
 */
export async function breakClubDuo(teamId: string): Promise<void> {
  if (isDemo()) return (await demo()).breakClubDuo(teamId);
  return guard(async () => {
    await requireUser();
    unwrapVoid(await supabase().rpc('club_duo_break', { p_team_id: teamId }));
  });
}
