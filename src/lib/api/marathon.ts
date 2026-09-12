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
import { guard, requireUser, unwrap } from './internal';
import { isDemo } from './mode';
import type {
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
}

export interface DbMarathonTask {
  id: string;
  marathon_id: string;
  day_index: number;
  sort_order: number;
  title: string;
  body: string | null;
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
    body: r.body,
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
  };
}

export const TASK_COLS = '*';

// --- reads -------------------------------------------------------------------

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
 * Send proof, or correct proof already sent. One row per (task, member), so this is an upsert.
 *
 * The day, the marathon and the clock are all the server's: the guard trigger fills them from the
 * task and stamps `submitted_at` itself, which is what stops a phone clock from moving a proof
 * back into a day that has closed.
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
