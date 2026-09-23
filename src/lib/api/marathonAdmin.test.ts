import { describe, expect, it } from 'vitest';
import {
  copyTasksResultFromDb,
  proofQueueFromDb,
  queuedProofFromDb,
  type DbQueuedProof,
} from './marathonAdmin';

const ROW: DbQueuedProof = {
  id: 'p1',
  marathon_id: 'm-duo',
  marathon_title: 'Клуб вдвоём',
  duo: true,
  member_id: 'mem1',
  member_name: '  Настя ',
  email: 'nastya@example.com',
  team_name: 'Настя и Маша · 7f3',
  task_id: 't1',
  task_title: 'Планка',
  proof_kind: 'number',
  unit: 'сек',
  day_index: 9,
  value_text: null,
  value_num: '60.50',
  media_path: 'm-duo/mem1/p1.jpg',
  submitted_at: '2026-09-22T10:00:00Z',
  attempt: 2,
  resubmitted_at: '2026-09-23T08:00:00Z',
  reviewed_at: null,
  voided_at: null,
  void_reason: 'Не видно секундомер',
  total: '41',
};

describe('copyTasksResultFromDb', () => {
  it('maps every counter', () => {
    expect(
      copyTasksResultFromDb({
        days_copied: 5,
        days_skipped: 1,
        days_locked: 1,
        tasks_copied: 12,
        tasks_replaced: 3,
      }),
    ).toEqual({ daysCopied: 5, daysSkipped: 1, daysLocked: 1, tasksCopied: 12, tasksReplaced: 3 });
  });
  it('reads a missing row as nothing done', () => {
    expect(copyTasksResultFromDb(undefined)).toEqual({
      daysCopied: 0,
      daysSkipped: 0,
      daysLocked: 0,
      tasksCopied: 0,
      tasksReplaced: 0,
    });
  });
});

describe('queuedProofFromDb', () => {
  it('maps the row, trims the name and turns a numeric string into a number', () => {
    const p = queuedProofFromDb(ROW);
    expect(p).toMatchObject({
      id: 'p1',
      marathonId: 'm-duo',
      marathonTitle: 'Клуб вдвоём',
      duo: true,
      memberId: 'mem1',
      memberName: 'Настя',
      email: 'nastya@example.com',
      teamName: 'Настя и Маша · 7f3',
      taskId: 't1',
      taskTitle: 'Планка',
      proofKind: 'number',
      unit: 'сек',
      dayIndex: 9,
      valueNum: 60.5,
      mediaPath: 'm-duo/mem1/p1.jpg',
      attempt: 2,
      resubmittedAt: '2026-09-23T08:00:00Z',
      reviewedAt: null,
      voidedAt: null,
      voidReason: 'Не видно секундомер',
    });
  });
  it('falls back to the address, a dash, `done` and attempt 1 when the row is thin', () => {
    const p = queuedProofFromDb({
      ...ROW,
      member_name: ' ',
      task_title: null,
      proof_kind: 'weird',
      attempt: null,
      value_num: null,
      duo: false,
    });
    expect(p.memberName).toBe('nastya@example.com');
    expect(p.taskTitle).toBe('—');
    expect(p.proofKind).toBe('done');
    expect(p.attempt).toBe(1);
    expect(p.valueNum).toBeNull();
    expect(p.duo).toBe(false);
  });
});

describe('proofQueueFromDb', () => {
  it('takes the total from the window count, not the page length', () => {
    const q = proofQueueFromDb([ROW, { ...ROW, id: 'p2' }]);
    expect(q.items.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(q.total).toBe(41);
  });
  it('is empty with a total of zero when nothing waits', () => {
    expect(proofQueueFromDb([])).toEqual({ items: [], total: 0 });
  });
});
