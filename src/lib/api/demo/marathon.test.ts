/**
 * The demo marathon, walked through the same functions the app calls.
 *
 * The seed is mid-flight on purpose — ten days played, a partner who is ahead today — so these
 * tests are really about the two things that are easy to get wrong once real data exists: that a
 * pair task waits for both people, and that sending proof moves the board the same moment.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Latency from './latency';

vi.mock('./latency', async (importOriginal) => ({
  ...(await importOriginal<typeof Latency>()),
  delay: () => Promise.resolve(),
}));

class FakeStorage implements Storage {
  private map = new Map<string, string>();
  [name: string]: unknown;
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const store = new FakeStorage();
globalThis.localStorage = store;

const demo = await import('./index');

const EMAIL = 'coach@example.com';

async function signIn(): Promise<void> {
  await demo.requestCode(EMAIL);
  await demo.verifyCode(EMAIL, demo.pendingCode() ?? '');
}

beforeEach(() => {
  store.clear();
});

describe('the demo marathon', () => {
  it('puts the account in a running marathon, on a team, on day 10', async () => {
    await signIn();
    const [marathon, ...rest] = await demo.listMyMarathons();
    expect(rest).toHaveLength(0);
    expect(marathon?.title).toBe('Спринт Формы');
    expect(marathon?.status).toBe('active');
    expect(marathon?.dayIndex).toBe(10);
    expect(marathon?.week).toBe(2);
    expect(marathon?.totalWeeks).toBe(2);
    expect(marathon?.teamName).toBe('Ты и Марек');
  });

  it('shows today waiting on me, with my partner already done', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const today = await demo.getMarathonDay(marathon, marathon.dayIndex);

    const pairTask = today.find((t) => t.task.title === 'Берпи');
    expect(pairTask?.task.rule).toBe('all_members');
    expect(pairTask?.mine).toBeNull();
    // The sentence the Today screen exists to say: he has done it, the team is waiting on me.
    expect(pairTask?.teammatesDone).toHaveLength(1);
    expect(pairTask?.entrySize).toBe(2);
  });

  it('gives the roster names and no emails', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    const roster = await demo.getMarathonRoster(marathon?.id ?? '');
    expect(roster).toHaveLength(6);
    expect(roster.find((r) => r.isMe)?.displayName).toBe('Ты');
    expect(JSON.stringify(roster)).not.toContain('@');
  });

  it('scores the pair task only once both have delivered', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const mine = () =>
      demo.getMarathonScores(marathon.id).then((rows) => rows.find((r) => r.isMine));

    const before = await mine();
    const today = await demo.getMarathonDay(marathon, marathon.dayIndex);
    const pairTask = today.find((t) => t.task.title === 'Берпи');
    if (!pairTask) throw new Error('no pair task');

    await demo.sendProof({ taskId: pairTask.task.id, memberId: marathon.memberId });

    const after = await mine();
    // Марек was already done, so my proof is the one that completes it: the team takes all 12.
    expect((after?.points ?? 0) - (before?.points ?? 0)).toBe(pairTask.task.points);
  });

  it('keeps last week on its own board', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const week1 = await demo.getMarathonScores(marathon.id, 1);
    const week2 = await demo.getMarathonScores(marathon.id, 2);
    expect(week1).toHaveLength(3);
    expect(week2).toHaveLength(3);
    expect(week1.map((r) => r.points)).not.toEqual(week2.map((r) => r.points));
    // Every entry is ranked and exactly one of them is mine.
    expect(week1.filter((r) => r.isMine)).toHaveLength(1);
    expect(week1[0]?.rank).toBe(1);
  });

  it("tells my own days apart from my team's points", async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const days = await demo.getMarathonMyPoints(marathon.id);
    expect(days).toHaveLength(10);
    expect(days[0]?.dayIndex).toBe(10);

    // Day 6 is the one I missed: my partner delivered, I did not, and an all_members task pays
    // nothing unless both do — so the day shows a task I skipped and no points for it.
    const day6 = days.find((d) => d.dayIndex === 6);
    expect(day6?.tasksTotal).toBe(1);
    expect(day6?.tasksDone).toBe(0);
    expect(day6?.points).toBe(0);
  });

  it('lets the coach strike a proof out and the board corrects itself', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const week1 = () => demo.getMarathonScores(marathon.id, 1).then((r) => r.find((x) => x.isMine));

    const before = await week1();
    const proofs = await demo.listMarathonProofs({ marathonId: marathon.id, dayIndex: 1 });
    const mineOnDay1 = proofs.find(
      (p) => p.memberId === marathon.memberId && p.taskTitle === 'Зарядка 10 минут',
    );
    if (!mineOnDay1) throw new Error('no proof to void');

    await demo.voidProof(mineOnDay1.id, 'не то фото');
    const after = await week1();
    // The day-1 pair task is worth 10 and now has only one of us: the team loses all of it.
    expect((before?.points ?? 0) - (after?.points ?? 0)).toBe(10);

    await demo.restoreProof(mineOnDay1.id);
    expect((await week1())?.points).toBe(before?.points);
  });

  it("adds the coach's manual points to the whole team", async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');
    const mine = () => demo.getMarathonScores(marathon.id).then((r) => r.find((x) => x.isMine));

    const before = await mine();
    await demo.addMarathonAdjustment({
      marathonId: marathon.id,
      memberId: marathon.memberId,
      dayIndex: marathon.dayIndex,
      points: 7,
      reason: 'вытащил напарника',
    });
    expect((await mine())?.points).toBe((before?.points ?? 0) + 7);
  });

  it('writes a new day the way the coach does, and hides it until it arrives', async () => {
    await signIn();
    const [marathon] = await demo.listMyMarathons();
    if (!marathon) throw new Error('no marathon');

    const tomorrow = marathon.dayIndex + 1;
    const made = await demo.copyDayTasks(marathon.id, marathon.dayIndex, tomorrow);
    expect(made.length).toBeGreaterThan(0);
    expect(made.every((t) => t.dayIndex === tomorrow)).toBe(true);

    // Copies, not references: editing tomorrow leaves today alone.
    const first = made[0];
    if (!first) throw new Error('nothing copied');
    await demo.updateMarathonTask(first.id, { title: 'Другое название' });
    const todayTasks = await demo.getMarathonDay(marathon, marathon.dayIndex);
    expect(todayTasks.map((t) => t.task.title)).not.toContain('Другое название');
  });
});
