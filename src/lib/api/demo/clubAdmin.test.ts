/** Club management (0047) over the demo store: the same rules as the SQL. */
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

describe('club management in the demo (0047)', () => {
  it('previews a week copy, then does exactly that, skipping a day that has tasks', async () => {
    await signIn();
    const m = await demo.createMarathon({
      slug: 'demo_copy',
      title: 'Круг',
      startsOn: '2026-09-21',
    });
    await demo.createMarathonTask(m.id, { dayIndex: 1, title: 'Планка' });
    await demo.createMarathonTask(m.id, { dayIndex: 2, title: 'Присед' });
    await demo.createMarathonTask(m.id, { dayIndex: 9, title: 'Уже было' });

    const input = { fromMarathonId: m.id, fromDay: 1, dayCount: 7, toMarathonId: m.id, toDay: 8 };
    const preview = await demo.copyTasks({ ...input, dryRun: true });
    expect(preview).toMatchObject({ daysCopied: 1, daysSkipped: 1, tasksCopied: 1 });
    expect((await demo.listMarathonTasks(m.id)).length).toBe(3);

    const done = await demo.copyTasks(input);
    expect(done).toEqual(preview);
    const titles = (await demo.listMarathonTasks(m.id))
      .filter((t) => t.dayIndex >= 8)
      .map((t) => `${t.dayIndex}:${t.title}`)
      .sort();
    expect(titles).toEqual(['8:Планка', '9:Уже было']);

    await expect(demo.copyTasks({ ...input, toDay: 4 })).rejects.toThrow('overlap');
  });

  it('makes a round the live club of its mode and finishes the previous one', async () => {
    await signIn();
    const a = await demo.createMarathon({
      slug: 'demo_a',
      title: 'A',
      startsOn: '2026-09-21',
      teamSize: 1,
    });
    const b = await demo.createMarathon({
      slug: 'demo_b',
      title: 'B',
      startsOn: '2026-09-28',
      teamSize: 1,
    });
    await demo.setLiveClub(a.id, false);
    await expect(demo.setLiveClub(b.id, true)).rejects.toThrow('mode_mismatch');
    expect(await demo.setLiveClub(b.id, false)).toBe(a.id);
    const rows = await demo.listMarathons();
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get(b.id)).toMatchObject({ isClub: true, status: 'active' });
    expect(byId.get(a.id)).toMatchObject({ isClub: false, status: 'finished' });
  });
});
