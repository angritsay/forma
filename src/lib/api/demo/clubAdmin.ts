/**
 * Club management (0047) for the demo backend: the same rules as the SQL, over the local store.
 *
 * Kept apart from `api.ts` so the four club tools read as one piece, the way the migration does.
 */
import { guard } from '../internal';
import { AppError } from '../errors';
import type { CopyTasksInput } from '../marathonAdmin';
import type { CopyTasksResult, MarathonMemberRow, ProofQueue, QueuedProofRow } from '../types';
import { delay } from './latency';
import { demoId, mutateDb, nowIso, readDb, type DemoDb } from './store';

async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => fn());
}

/** The live club of a mode, the demo's `club_marathon(p_duo)`. */
function liveClub(db: DemoDb, duo: boolean) {
  return (
    db.marathons.find((m) => m.isClub && m.status === 'active' && m.teamSize > 1 === duo) ?? null
  );
}

export async function copyTasks(input: CopyTasksInput): Promise<CopyTasksResult> {
  return run(() =>
    mutateDb((db) => {
      const from = db.marathons.find((m) => m.id === input.fromMarathonId);
      const to = db.marathons.find((m) => m.id === input.toMarathonId);
      if (!from || !to) throw new AppError('not_found', 'marathon_not_found');
      const n = input.dayCount;
      if (n < 1 || n > 62) throw new AppError('validation', 'invalid_range');
      if (
        input.fromDay < 1 ||
        input.fromDay + n - 1 > from.days ||
        input.toDay < 1 ||
        input.toDay + n - 1 > to.days
      ) {
        throw new AppError('validation', 'out_of_range');
      }
      const same = from.id === to.id;
      if (same && input.toDay < input.fromDay + n && input.fromDay < input.toDay + n) {
        throw new AppError('validation', 'overlap');
      }
      const out: CopyTasksResult = {
        daysCopied: 0,
        daysSkipped: 0,
        daysLocked: 0,
        tasksCopied: 0,
        tasksReplaced: 0,
      };
      for (let i = 0; i < n; i += 1) {
        const src = db.marathonTasks.filter(
          (t) => t.marathonId === from.id && t.dayIndex === input.fromDay + i,
        );
        if (src.length === 0) continue;
        const dstDay = input.toDay + i;
        const dst = db.marathonTasks.filter((t) => t.marathonId === to.id && t.dayIndex === dstDay);
        if (dst.length > 0) {
          if (!input.overwrite) {
            out.daysSkipped += 1;
            continue;
          }
          const ids = new Set(dst.map((t) => t.id));
          if (db.marathonSubmissions.some((s) => ids.has(s.taskId))) {
            out.daysLocked += 1;
            continue;
          }
          out.tasksReplaced += dst.length;
          if (!input.dryRun) db.marathonTasks = db.marathonTasks.filter((t) => !ids.has(t.id));
        }
        out.daysCopied += 1;
        out.tasksCopied += src.length;
        if (input.dryRun) continue;
        for (const task of src) {
          const id = demoId('mtask');
          db.marathonTasks.push({ ...task, id, marathonId: to.id, dayIndex: dstDay });
          if (same) {
            db.marathonTaskTargets.push(
              ...db.marathonTaskTargets
                .filter((g) => g.taskId === task.id)
                .map((g) => ({ ...g, taskId: id })),
            );
          }
        }
      }
      return out;
    }),
  );
}

function pair(
  db: DemoDb,
  marathonId: string,
  a: MarathonMemberRow,
  b: MarathonMemberRow,
  auto: boolean,
) {
  const name = (m: MarathonMemberRow) => m.displayName?.trim() || m.email.split('@')[0] || '—';
  const id = demoId('mteam');
  db.marathonTeams.push({
    id,
    marathonId,
    name: `${name(a)} и ${name(b)}`,
    sortOrder: db.marathonTeams.length,
    isAuto: auto,
  });
  db.marathonMembers = db.marathonMembers.map((m) =>
    m.id === a.id || m.id === b.id ? { ...m, teamId: id } : m,
  );
  return id;
}

function breakTeam(db: DemoDb, teamId: string) {
  db.marathonTeams = db.marathonTeams.filter((t) => t.id !== teamId);
  db.marathonMembers = db.marathonMembers.map((m) =>
    m.teamId === teamId ? { ...m, teamId: null } : m,
  );
}

export async function rematchDuo(): Promise<number> {
  return run(() =>
    mutateDb((db) => {
      const club = liveClub(db, true);
      if (!club) throw new AppError('not_found', 'no_club');
      for (const t of db.marathonTeams.filter((x) => x.marathonId === club.id && x.isAuto)) {
        breakTeam(db, t.id);
      }
      const free = db.marathonMembers
        .filter((m) => m.marathonId === club.id && m.status === 'active' && !m.teamId)
        .sort(() => Math.random() - 0.5);
      let pairs = 0;
      for (let i = 0; i + 1 < free.length; i += 2) {
        pair(db, club.id, free[i]!, free[i + 1]!, true);
        pairs += 1;
      }
      return pairs;
    }),
  );
}

export async function splitDuo(teamId: string): Promise<void> {
  return run(() =>
    mutateDb((db) => {
      const club = liveClub(db, true);
      if (!club) throw new AppError('not_found', 'no_club');
      if (!db.marathonTeams.some((t) => t.id === teamId && t.marathonId === club.id)) {
        throw new AppError('not_found', 'team_not_found');
      }
      breakTeam(db, teamId);
    }),
  );
}

export async function pairDuo(emailA: string, emailB: string, keep = false): Promise<string> {
  return run(() =>
    mutateDb((db) => {
      const club = liveClub(db, true);
      if (!club) throw new AppError('not_found', 'no_club');
      const find = (email: string) =>
        db.marathonMembers.find(
          (m) =>
            m.marathonId === club.id &&
            m.status === 'active' &&
            m.email.toLowerCase() === email.trim().toLowerCase(),
        );
      const a = find(emailA);
      const b = find(emailB);
      if (!a || !b || a.id === b.id) throw new AppError('validation', 'member_not_in_club');
      if (a.teamId || b.teamId) throw new AppError('validation', 'already_paired');
      return pair(db, club.id, a, b, !keep);
    }),
  );
}

export async function setLiveClub(marathonId: string, duo: boolean): Promise<string | null> {
  return run(() =>
    mutateDb((db) => {
      const row = db.marathons.find((m) => m.id === marathonId);
      if (!row) throw new AppError('not_found', 'marathon_not_found');
      if (row.teamSize > 1 !== duo) throw new AppError('validation', 'mode_mismatch');
      const prev = db.marathons.find(
        (m) => m.isClub && m.teamSize > 1 === duo && m.id !== marathonId,
      );
      db.marathons = db.marathons.map((m) => {
        if (prev && m.id === prev.id) {
          return { ...m, isClub: false, status: m.status === 'active' ? 'finished' : m.status };
        }
        if (m.id === marathonId)
          return { ...m, isClub: true, status: 'active', updatedAt: nowIso() };
        return m;
      });
      return prev?.id ?? null;
    }),
  );
}

export async function listProofQueue(
  options: { limit?: number; proofId?: string } = {},
): Promise<ProofQueue> {
  return run(() => {
    const db = readDb();
    const clubs = new Set(
      [liveClub(db, false), liveClub(db, true)].filter(Boolean).map((m) => m!.id),
    );
    const when = (s: { resubmittedAt: string | null; submittedAt: string }) =>
      s.resubmittedAt ?? s.submittedAt;
    const rows = db.marathonSubmissions
      .filter((s) =>
        options.proofId
          ? s.id === options.proofId
          : clubs.has(s.marathonId) && !s.voidedAt && !s.reviewedAt,
      )
      .sort((a, b) => when(b).localeCompare(when(a)));
    const items = rows
      .slice(0, Math.min(Math.max(options.limit ?? 50, 1), 200))
      .map((s): QueuedProofRow => {
        const m = db.marathons.find((x) => x.id === s.marathonId);
        const member = db.marathonMembers.find((x) => x.id === s.memberId);
        const task = db.marathonTasks.find((x) => x.id === s.taskId);
        const team = member?.teamId
          ? db.marathonTeams.find((t) => t.id === member.teamId)
          : undefined;
        return {
          ...s,
          memberName: member?.displayName?.trim() || member?.email || '—',
          teamName: team?.name ?? null,
          taskTitle: task?.title ?? '—',
          proofKind: task?.proofKind ?? 'done',
          unit: task?.unit ?? null,
          marathonTitle: m?.title ?? '—',
          duo: (m?.teamSize ?? 1) > 1,
          email: member?.email ?? '',
        };
      });
    return { items, total: rows.length };
  });
}

export async function markProofsReviewed(ids: readonly string[]): Promise<number> {
  return run(() =>
    mutateDb((db) => {
      const want = new Set(ids);
      let n = 0;
      const at = nowIso();
      db.marathonSubmissions = db.marathonSubmissions.map((s) => {
        if (!want.has(s.id) || s.voidedAt || s.reviewedAt) return s;
        n += 1;
        return { ...s, reviewedAt: at };
      });
      return n;
    }),
  );
}
