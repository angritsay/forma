/**
 * The marathon, as the coach runs it: create a run, write each day's tasks, pair people up, read
 * the proofs feed, strike a proof out, hand out points by hand.
 *
 * Admin-only by row-level security — none of these functions carries its own permission check,
 * because a check in the client is a comment, not a guard. What they do carry is the shape of the
 * work: `copyDayTasks` and `repeatTask` exist because the coach's real question every morning is
 * "same as yesterday, plus one", and making him retype it is how a daily format dies in week two.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { EMAIL_RE, guard, unwrap, unwrapVoid } from './internal';
import {
  submissionFromDb,
  taskFromDb,
  TASK_COLS,
  type DbMarathonSubmission,
  type DbMarathonTask,
} from './marathon';
import { isDemo } from './mode';
import type {
  MarathonAdjustmentRow,
  MarathonMemberPatch,
  MarathonMemberRow,
  MarathonPatch,
  MarathonProofRow,
  MarathonRow,
  MarathonTaskPatch,
  MarathonTaskRow,
  MarathonTeamRow,
} from './types';

interface DbMarathon {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: MarathonRow['status'];
  starts_on: string;
  days: number;
  team_size: number;
  timezone: string;
  due_time: string;
  prize: string | null;
  created_at: string;
  updated_at: string;
}

interface DbMember {
  id: string;
  marathon_id: string;
  email: string;
  team_id: string | null;
  display_name: string | null;
  status: 'active' | 'removed';
  note: string | null;
  created_at: string;
}

interface DbTeam {
  id: string;
  marathon_id: string;
  name: string;
  sort_order: number;
}

interface DbAdjustment {
  id: string;
  marathon_id: string;
  member_id: string;
  day_index: number;
  points: number;
  reason: string;
  created_at: string;
}

function marathonFromDb(r: DbMarathon): MarathonRow {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    status: r.status,
    startsOn: r.starts_on,
    days: r.days,
    teamSize: r.team_size,
    timezone: r.timezone,
    dueTime: r.due_time,
    prize: r.prize,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function memberFromDb(r: DbMember): MarathonMemberRow {
  return {
    id: r.id,
    marathonId: r.marathon_id,
    email: r.email,
    teamId: r.team_id,
    displayName: r.display_name,
    status: r.status,
    note: r.note,
    createdAt: r.created_at,
  };
}

const teamFromDb = (r: DbTeam): MarathonTeamRow => ({
  id: r.id,
  marathonId: r.marathon_id,
  name: r.name,
  sortOrder: r.sort_order,
});

const adjustmentFromDb = (r: DbAdjustment): MarathonAdjustmentRow => ({
  id: r.id,
  marathonId: r.marathon_id,
  memberId: r.member_id,
  dayIndex: r.day_index,
  points: r.points,
  reason: r.reason,
  createdAt: r.created_at,
});

/**
 * Only the fields the caller actually set are sent: `undefined` leaves a column alone, `null`
 * clears it. The editor saves one field at a time, so a mapper that spread the whole object would
 * blank everything the open form was not showing.
 */
export function marathonPatchToDb(patch: MarathonPatch): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (patch.slug !== undefined) db.slug = patch.slug;
  if (patch.title !== undefined) db.title = patch.title;
  if (patch.description !== undefined) db.description = patch.description;
  if (patch.status !== undefined) db.status = patch.status;
  if (patch.startsOn !== undefined) db.starts_on = patch.startsOn;
  if (patch.days !== undefined) db.days = patch.days;
  if (patch.teamSize !== undefined) db.team_size = patch.teamSize;
  if (patch.timezone !== undefined) db.timezone = patch.timezone;
  if (patch.dueTime !== undefined) db.due_time = patch.dueTime;
  if (patch.prize !== undefined) db.prize = patch.prize;
  return db;
}

export function taskPatchToDb(patch: MarathonTaskPatch): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (patch.dayIndex !== undefined) db.day_index = patch.dayIndex;
  if (patch.sortOrder !== undefined) db.sort_order = patch.sortOrder;
  if (patch.title !== undefined) db.title = patch.title;
  if (patch.body !== undefined) db.body = patch.body;
  if (patch.mediaUrl !== undefined) db.media_url = patch.mediaUrl;
  if (patch.proofKind !== undefined) db.proof_kind = patch.proofKind;
  if (patch.unit !== undefined) db.unit = patch.unit;
  if (patch.targetNum !== undefined) db.target_num = patch.targetNum;
  if (patch.rule !== undefined) db.rule = patch.rule;
  if (patch.points !== undefined) db.points = patch.points;
  // A cap only exists for the capped rule; the table's check constraint says so, and clearing it
  // here means switching a task's rule in the editor never leaves a stale ceiling behind.
  if (patch.cap !== undefined) db.cap = patch.cap;
  if (patch.audience !== undefined) db.audience = patch.audience;
  if (patch.proofVisibility !== undefined) db.proof_visibility = patch.proofVisibility;
  if (patch.dueTime !== undefined) db.due_time = patch.dueTime;
  if (patch.lateCounts !== undefined) db.late_counts = patch.lateCounts;
  return db;
}

// --- marathons ---------------------------------------------------------------

/** Every marathon, drafts and finished runs included, newest start first. */
export async function listMarathons(): Promise<MarathonRow[]> {
  if (isDemo()) return (await demo()).listMarathons();
  return guard(async () => {
    const rows = unwrap<DbMarathon[]>(
      await supabase().from('marathons').select('*').order('starts_on', { ascending: false }),
    );
    return rows.map(marathonFromDb);
  });
}

export async function getMarathon(id: string): Promise<MarathonRow> {
  if (isDemo()) return (await demo()).getMarathon(id);
  return guard(async () =>
    marathonFromDb(
      unwrap<DbMarathon>(await supabase().from('marathons').select('*').eq('id', id).single()),
    ),
  );
}

export async function createMarathon(input: {
  slug: string;
  title: string;
  startsOn: string;
  days?: number;
  teamSize?: number;
  timezone?: string;
  dueTime?: string;
}): Promise<MarathonRow> {
  if (isDemo()) return (await demo()).createMarathon(input);
  return guard(async () =>
    marathonFromDb(
      unwrap<DbMarathon>(
        await supabase()
          .from('marathons')
          .insert({
            slug: input.slug,
            title: input.title,
            starts_on: input.startsOn,
            days: input.days ?? 28,
            team_size: input.teamSize ?? 2,
            timezone: input.timezone ?? 'Europe/Moscow',
            due_time: input.dueTime ?? '22:00',
          })
          .select('*')
          .single(),
      ),
    ),
  );
}

export async function updateMarathon(id: string, patch: MarathonPatch): Promise<MarathonRow> {
  if (isDemo()) return (await demo()).updateMarathon(id, patch);
  return guard(async () =>
    marathonFromDb(
      unwrap<DbMarathon>(
        await supabase()
          .from('marathons')
          .update(marathonPatchToDb(patch))
          .eq('id', id)
          .select('*')
          .single(),
      ),
    ),
  );
}

export async function deleteMarathon(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteMarathon(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('marathons').delete().eq('id', id));
  });
}

// --- the day plan ------------------------------------------------------------

/** Every task of a marathon, in day then sort order — the whole plan in one load. */
export async function listMarathonTasks(marathonId: string): Promise<MarathonTaskRow[]> {
  if (isDemo()) return (await demo()).listMarathonTasks(marathonId);
  return guard(async () => {
    const rows = unwrap<DbMarathonTask[]>(
      await supabase()
        .from('marathon_tasks')
        .select(TASK_COLS)
        .eq('marathon_id', marathonId)
        .order('day_index', { ascending: true })
        .order('sort_order', { ascending: true }),
    );
    return rows.map(taskFromDb);
  });
}

export async function createMarathonTask(
  marathonId: string,
  patch: MarathonTaskPatch & { dayIndex: number; title: string },
): Promise<MarathonTaskRow> {
  if (isDemo()) return (await demo()).createMarathonTask(marathonId, patch);
  return guard(async () =>
    taskFromDb(
      unwrap<DbMarathonTask>(
        await supabase()
          .from('marathon_tasks')
          .insert({ marathon_id: marathonId, ...taskPatchToDb(patch) })
          .select(TASK_COLS)
          .single(),
      ),
    ),
  );
}

export async function updateMarathonTask(
  id: string,
  patch: MarathonTaskPatch,
): Promise<MarathonTaskRow> {
  if (isDemo()) return (await demo()).updateMarathonTask(id, patch);
  return guard(async () =>
    taskFromDb(
      unwrap<DbMarathonTask>(
        await supabase()
          .from('marathon_tasks')
          .update(taskPatchToDb(patch))
          .eq('id', id)
          .select(TASK_COLS)
          .single(),
      ),
    ),
  );
}

export async function deleteMarathonTask(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteMarathonTask(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('marathon_tasks').delete().eq('id', id));
  });
}

/** The fields of a task that carry over when it is copied to another day. */
function taskSeed(task: MarathonTaskRow): MarathonTaskPatch & { title: string } {
  return {
    sortOrder: task.sortOrder,
    title: task.title,
    body: task.body,
    mediaUrl: task.mediaUrl,
    proofKind: task.proofKind,
    unit: task.unit,
    targetNum: task.targetNum,
    rule: task.rule,
    points: task.points,
    cap: task.cap,
    audience: task.audience,
    proofVisibility: task.proofVisibility,
    dueTime: task.dueTime,
    lateCounts: task.lateCounts,
  };
}

/**
 * Copy one day's tasks onto another day — "same as yesterday" as a single action.
 *
 * Copies, not references: the new day gets its own rows, so editing tomorrow never rewrites what
 * people already did today. That is the same reason a repeating task is stored as one row per day
 * rather than as a rule with an end date.
 */
export async function copyDayTasks(
  marathonId: string,
  fromDay: number,
  toDay: number,
): Promise<MarathonTaskRow[]> {
  if (isDemo()) return (await demo()).copyDayTasks(marathonId, fromDay, toDay);
  const all = await listMarathonTasks(marathonId);
  const source = all.filter((t) => t.dayIndex === fromDay);
  if (source.length === 0) throw new AppError('not_found', 'no_tasks_on_that_day');
  const made: MarathonTaskRow[] = [];
  for (const task of source) {
    made.push(await createMarathonTask(marathonId, { ...taskSeed(task), dayIndex: toDay }));
  }
  return made;
}

/**
 * Repeat a task on every day from the next one through `untilDay` — the warm-up that happens every
 * morning, entered once. Each day gets its own row, so any single morning can still be rewritten.
 */
export async function repeatTask(
  task: MarathonTaskRow,
  untilDay: number,
): Promise<MarathonTaskRow[]> {
  const made: MarathonTaskRow[] = [];
  for (let day = task.dayIndex + 1; day <= untilDay; day += 1) {
    made.push(await createMarathonTask(task.marathonId, { ...taskSeed(task), dayIndex: day }));
  }
  return made;
}

// --- people and teams --------------------------------------------------------

export async function listMarathonTeams(marathonId: string): Promise<MarathonTeamRow[]> {
  if (isDemo()) return (await demo()).listMarathonTeams(marathonId);
  return guard(async () => {
    const rows = unwrap<DbTeam[]>(
      await supabase()
        .from('marathon_teams')
        .select('*')
        .eq('marathon_id', marathonId)
        .order('sort_order', { ascending: true }),
    );
    return rows.map(teamFromDb);
  });
}

export async function createMarathonTeam(
  marathonId: string,
  name: string,
  sortOrder = 0,
): Promise<MarathonTeamRow> {
  if (isDemo()) return (await demo()).createMarathonTeam(marathonId, name, sortOrder);
  return guard(async () =>
    teamFromDb(
      unwrap<DbTeam>(
        await supabase()
          .from('marathon_teams')
          .insert({ marathon_id: marathonId, name, sort_order: sortOrder })
          .select('*')
          .single(),
      ),
    ),
  );
}

export async function renameMarathonTeam(id: string, name: string): Promise<MarathonTeamRow> {
  if (isDemo()) return (await demo()).renameMarathonTeam(id, name);
  return guard(async () =>
    teamFromDb(
      unwrap<DbTeam>(
        await supabase().from('marathon_teams').update({ name }).eq('id', id).select('*').single(),
      ),
    ),
  );
}

/** Deleting a team leaves its members in the marathon, each on their own. */
export async function deleteMarathonTeam(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteMarathonTeam(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('marathon_teams').delete().eq('id', id));
  });
}

export async function listMarathonMembers(marathonId: string): Promise<MarathonMemberRow[]> {
  if (isDemo()) return (await demo()).listMarathonMembers(marathonId);
  return guard(async () => {
    const rows = unwrap<DbMember[]>(
      await supabase()
        .from('marathon_members')
        .select('*')
        .eq('marathon_id', marathonId)
        .order('created_at', { ascending: true }),
    );
    return rows.map(memberFromDb);
  });
}

/**
 * Add someone by email, whether or not they have ever opened the app — the coach works from his
 * Telegram group, and the row has to exist before the day plan means anything. When they do sign
 * in with that address, the marathon is simply there.
 */
export async function addMarathonMember(input: {
  marathonId: string;
  email: string;
  displayName?: string | null;
  teamId?: string | null;
  note?: string | null;
}): Promise<MarathonMemberRow> {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new AppError('validation', 'invalid_email');
  if (isDemo()) return (await demo()).addMarathonMember({ ...input, email });
  return guard(async () =>
    memberFromDb(
      unwrap<DbMember>(
        await supabase()
          .from('marathon_members')
          .insert({
            marathon_id: input.marathonId,
            email,
            display_name: input.displayName ?? null,
            team_id: input.teamId ?? null,
            note: input.note ?? null,
          })
          .select('*')
          .single(),
      ),
    ),
  );
}

export async function updateMarathonMember(
  id: string,
  patch: MarathonMemberPatch,
): Promise<MarathonMemberRow> {
  if (isDemo()) return (await demo()).updateMarathonMember(id, patch);
  const db: Record<string, unknown> = {};
  if (patch.teamId !== undefined) db.team_id = patch.teamId;
  if (patch.displayName !== undefined) db.display_name = patch.displayName;
  if (patch.status !== undefined) db.status = patch.status;
  if (patch.note !== undefined) db.note = patch.note;
  return guard(async () =>
    memberFromDb(
      unwrap<DbMember>(
        await supabase().from('marathon_members').update(db).eq('id', id).select('*').single(),
      ),
    ),
  );
}

// --- the proofs feed ---------------------------------------------------------

export interface ProofFilter {
  marathonId: string;
  dayIndex?: number;
  taskId?: string;
  memberId?: string;
  /** Only proof that has been struck out — how the coach reviews his own corrections. */
  voidedOnly?: boolean;
  limit?: number;
}

/**
 * Newest proof first, with the names the coach needs to read it: who sent it, whose team they are
 * on, and what the task asked for. He is reading a stream of evidence, not a table of foreign keys.
 */
export async function listMarathonProofs(filter: ProofFilter): Promise<MarathonProofRow[]> {
  if (isDemo()) return (await demo()).listMarathonProofs(filter);
  return guard(async () => {
    let q = supabase()
      .from('marathon_submissions')
      .select('*')
      .eq('marathon_id', filter.marathonId)
      .order('submitted_at', { ascending: false })
      .limit(filter.limit ?? 200);
    if (filter.dayIndex !== undefined) q = q.eq('day_index', filter.dayIndex);
    if (filter.taskId) q = q.eq('task_id', filter.taskId);
    if (filter.memberId) q = q.eq('member_id', filter.memberId);
    if (filter.voidedOnly) q = q.not('voided_at', 'is', null);
    const proofs = unwrap<DbMarathonSubmission[]>(await q).map(submissionFromDb);
    if (proofs.length === 0) return [];

    const [tasks, members, teams] = await Promise.all([
      listMarathonTasks(filter.marathonId),
      listMarathonMembers(filter.marathonId),
      listMarathonTeams(filter.marathonId),
    ]);
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const memberById = new Map(members.map((m) => [m.id, m]));
    const teamById = new Map(teams.map((t) => [t.id, t]));

    return proofs.map((p) => {
      const task = taskById.get(p.taskId);
      const member = memberById.get(p.memberId);
      return {
        ...p,
        memberName: member?.displayName?.trim() || member?.email || '—',
        teamName: member?.teamId ? (teamById.get(member.teamId)?.name ?? null) : null,
        taskTitle: task?.title ?? '—',
        proofKind: task?.proofKind ?? 'done',
        unit: task?.unit ?? null,
      };
    });
  });
}

/**
 * Strike a proof out, with a reason. The row stays — the athlete can still see what they sent and
 * why it did not count — it simply stops scoring, and the board corrects itself on the next read.
 */
export async function voidProof(id: string, reason: string): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw new AppError('validation', 'reason_required');
  if (isDemo()) return (await demo()).voidProof(id, trimmed);
  return guard(async () => {
    unwrapVoid(
      await supabase()
        .from('marathon_submissions')
        .update({ voided_at: new Date().toISOString(), void_reason: trimmed })
        .eq('id', id),
    );
  });
}

/** Undo a void — the coach changed his mind, or struck the wrong line. */
export async function restoreProof(id: string): Promise<void> {
  if (isDemo()) return (await demo()).restoreProof(id);
  return guard(async () => {
    unwrapVoid(
      await supabase()
        .from('marathon_submissions')
        .update({ voided_at: null, void_reason: null, voided_by: null })
        .eq('id', id),
    );
  });
}

/** Enter proof that arrived somewhere else — in the group chat, or by message. */
export async function recordProofFor(input: {
  taskId: string;
  memberId: string;
  valueText?: string | null;
  valueNum?: number | null;
  submittedAt?: string;
}): Promise<void> {
  if (isDemo()) return (await demo()).recordProofFor(input);
  return guard(async () => {
    unwrapVoid(
      await supabase()
        .from('marathon_submissions')
        .upsert(
          {
            task_id: input.taskId,
            member_id: input.memberId,
            value_text: input.valueText ?? null,
            value_num: input.valueNum ?? null,
            submitted_at: input.submittedAt ?? new Date().toISOString(),
          },
          { onConflict: 'task_id,member_id' },
        ),
    );
  });
}

// --- manual points -----------------------------------------------------------

export async function listMarathonAdjustments(
  marathonId: string,
): Promise<MarathonAdjustmentRow[]> {
  if (isDemo()) return (await demo()).listMarathonAdjustments(marathonId);
  return guard(async () => {
    const rows = unwrap<DbAdjustment[]>(
      await supabase()
        .from('marathon_adjustments')
        .select('*')
        .eq('marathon_id', marathonId)
        .order('created_at', { ascending: false }),
    );
    return rows.map(adjustmentFromDb);
  });
}

/** ±points with a reason, always visible to the person they land on. */
export async function addMarathonAdjustment(input: {
  marathonId: string;
  memberId: string;
  dayIndex: number;
  points: number;
  reason: string;
}): Promise<MarathonAdjustmentRow> {
  const reason = input.reason.trim();
  if (!reason) throw new AppError('validation', 'reason_required');
  if (input.points === 0) throw new AppError('validation', 'points_required');
  if (isDemo()) return (await demo()).addMarathonAdjustment({ ...input, reason });
  return guard(async () =>
    adjustmentFromDb(
      unwrap<DbAdjustment>(
        await supabase()
          .from('marathon_adjustments')
          .insert({
            marathon_id: input.marathonId,
            member_id: input.memberId,
            day_index: input.dayIndex,
            points: input.points,
            reason,
          })
          .select('*')
          .single(),
      ),
    ),
  );
}

export async function deleteMarathonAdjustment(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteMarathonAdjustment(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('marathon_adjustments').delete().eq('id', id));
  });
}
