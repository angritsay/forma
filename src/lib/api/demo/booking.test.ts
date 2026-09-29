/**
 * The demo's calendar (0055) walked the way the «Тренер» tab walks it: free slots, a hold, the
 * payment the demo stands in for, the session on the card, a move — and the admin's side.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAppError } from '../errors';
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

const DAY = 86_400_000;
const EMAIL = 'client@example.com';

async function signIn() {
  await demo.requestCode(EMAIL);
  await demo.verifyCode(EMAIL, demo.pendingCode() ?? '');
}

function window14() {
  const now = Date.now();
  return [new Date(now).toISOString(), new Date(now + 14 * DAY).toISOString()] as const;
}

async function codeOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return 'ok';
  } catch (e) {
    return isAppError(e) ? e.message : 'unknown';
  }
}

beforeEach(async () => {
  store.clear();
  await signIn();
});

describe('demo calendar — the client', () => {
  it('offers Sergey’s seeded week and hides Nastia without her flag', async () => {
    const [from, to] = window14();
    const slots = await demo.listFreeSlots('sergey', 'half', from, to);
    expect(slots.length).toBeGreaterThan(10);
    for (const s of slots) {
      expect(Date.parse(s.endsAt) - Date.parse(s.startsAt)).toBe(30 * 60_000);
    }
    expect(await codeOf(demo.listFreeSlots('nastia', 'half', from, to))).toBe('coach_unavailable');
  });

  it('holds a slot, takes it off the list, and the payment turns it into a session', async () => {
    const [from, to] = window14();
    const [first] = await demo.listFreeSlots('sergey', 'hour', from, to);
    expect(first).toBeDefined();
    const hold = await demo.holdSlot('sergey', 'hour', first!.startsAt);
    expect(hold?.optionId).toBe('hour');
    expect(Date.parse(hold!.holdExpiresAt) - Date.now()).toBeGreaterThan(19 * 60_000);
    expect(await demo.getMyHold()).toEqual(hold);

    // The same pick again is the same hold, not a new one.
    expect((await demo.holdSlot('sergey', 'hour', first!.startsAt))?.id).toBe(hold!.id);

    // A hold is never a session.
    expect((await demo.getMyCoachBookings()).some((b) => b.id === hold!.id)).toBe(false);

    expect(await demo.confirmDemoHold()).toBe(true);
    expect(await demo.getMyHold()).toBeNull();
    const booked = (await demo.getMyCoachBookings()).find((b) => b.id === hold!.id);
    expect(booked).toMatchObject({ coachId: 'sergey', optionId: 'hour', status: 'active' });
    expect(booked?.joinUrl).toMatch(/^https:\/\//);

    const after = await demo.listFreeSlots('sergey', 'hour', from, to);
    expect(after.some((s) => s.startsAt === first!.startsAt)).toBe(false);
  });

  it('gives a hold back', async () => {
    const [from, to] = window14();
    const [first] = await demo.listFreeSlots('sergey', 'half', from, to);
    await demo.holdSlot('sergey', 'half', first!.startsAt);
    await demo.releaseHold();
    expect(await demo.getMyHold()).toBeNull();
    const again = await demo.listFreeSlots('sergey', 'half', from, to);
    expect(again.some((s) => s.startsAt === first!.startsAt)).toBe(true);
  });

  it('moves a session 24 hours ahead into a free slot, and refuses the seeded one tomorrow', async () => {
    const [from, to] = window14();
    const slots = await demo.listFreeSlots('sergey', 'hour', from, to);
    const later = slots.filter((s) => Date.parse(s.startsAt) > Date.now() + 3 * DAY);
    await demo.holdSlot('sergey', 'hour', later[0]!.startsAt);
    await demo.confirmDemoHold();
    const mine = (await demo.getMyCoachBookings()).find((b) => b.startsAt === later[0]!.startsAt);
    const moved = await demo.moveMyBooking(mine!.id, later[3]!.startsAt);
    expect(moved.startsAt).toBe(later[3]!.startsAt);

    const seeded = (await demo.getMyCoachBookings()).find(
      (b) => Date.parse(b.startsAt) < Date.now() + DAY + 60 * 60_000 && b.status === 'active',
    );
    if (seeded && Date.parse(seeded.startsAt) - Date.now() < DAY) {
      expect(await codeOf(demo.moveMyBooking(seeded.id, later[5]!.startsAt))).toBe('too_late');
    }
  });
});

describe('demo calendar — the admin', () => {
  it('edits the week and the exceptions, and the picker follows', async () => {
    const [from, to] = window14();
    await demo.setWeeklyRules('sergey', []);
    expect(await demo.listFreeSlots('sergey', 'half', from, to)).toEqual([]);

    const today = new Date().toISOString().slice(0, 10);
    const date = new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10);
    await demo.addException('sergey', { date, start: '12:00', end: '13:00', kind: 'extra' });
    const slots = await demo.listFreeSlots('sergey', 'half', from, to);
    expect(slots).toHaveLength(2);

    const { exceptions } = await demo.getAvailability('sergey', today);
    expect(exceptions).toHaveLength(1);
    await demo.deleteException(exceptions[0]!.id);
    expect((await demo.getAvailability('sergey', today)).exceptions).toEqual([]);
  });

  it('saves a room link, and moves and cancels a session', async () => {
    await demo.saveCoach('sergey', { roomUrl: 'https://example.com/room/new' });
    expect((await demo.listCoaches()).find((c) => c.id === 'sergey')?.roomUrl).toBe(
      'https://example.com/room/new',
    );

    const [row] = await demo.listAdminBookings('upcoming');
    expect(row?.coachId).toBe('sergey');
    const target = new Date(Date.now() + 5 * DAY).toISOString();
    await demo.adminMoveBooking(row!.id, target);
    expect((await demo.listAdminBookings('upcoming'))[0]?.startsAt).toBe(target);

    await demo.adminCancelBooking(row!.id, 'coach is ill');
    const [cancelled] = await demo.listAdminBookings('cancelled');
    expect(cancelled).toMatchObject({ id: row!.id, cancelReason: 'coach is ill' });
  });
});
