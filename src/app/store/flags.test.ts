/**
 * The flags store (0049): off until loaded, on once the server says so, off when it cannot say.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const listMyFlags = vi.fn<() => Promise<string[]>>();
vi.mock('@/lib/api/flags', () => ({ listMyFlags: () => listMyFlags() }));

const { useFlags } = await import('./flags');

/** `useFlag` is a selector over the store; read it the same way outside React. */
const flagOn = (flag: string) => useFlags.getState().flags.includes(flag);

beforeEach(() => {
  listMyFlags.mockReset();
  useFlags.getState().clear();
});

describe('flags store', () => {
  it('reads every flag as off before anything is loaded', () => {
    expect(useFlags.getState().loaded).toBe(false);
    expect(flagOn('coach_nastia')).toBe(false);
  });

  it('turns a flag on once the server lists it', async () => {
    listMyFlags.mockResolvedValue(['coach_nastia']);
    await useFlags.getState().load();
    expect(useFlags.getState().loaded).toBe(true);
    expect(flagOn('coach_nastia')).toBe(true);
  });

  it('leaves every flag off when the first load fails, and never throws', async () => {
    listMyFlags.mockRejectedValue(new Error('offline'));
    await expect(useFlags.getState().load()).resolves.toBeUndefined();
    expect(flagOn('coach_nastia')).toBe(false);
  });

  it('keeps what it knew when a later re-read fails', async () => {
    listMyFlags.mockResolvedValueOnce(['coach_nastia']);
    await useFlags.getState().load();
    listMyFlags.mockRejectedValueOnce(new Error('offline'));
    await useFlags.getState().load();
    expect(flagOn('coach_nastia')).toBe(true);
  });

  it('drops the flags on clear, and a load in flight across a sign-out does not bring them back', async () => {
    let resolve: (v: string[]) => void = () => {};
    listMyFlags.mockReturnValue(new Promise((r) => (resolve = r)));
    const pending = useFlags.getState().load();
    useFlags.getState().clear();
    resolve(['coach_nastia']);
    await pending;
    expect(flagOn('coach_nastia')).toBe(false);
    expect(useFlags.getState().loaded).toBe(false);
  });
});
