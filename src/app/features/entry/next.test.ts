import { describe, expect, it } from 'vitest';
import { consumeNext, isNextPath, NEXT_KEY, rememberNext } from './next';

function memory(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('isNextPath', () => {
  it.each([
    '/start',
    '/marathon',
    '/invite',
    '/duo',
    '/book',
    '/book?len=half',
    '/book?len=hour',
    '/courses/start',
    '/courses/start/nodes/abc',
    '/courses/kettle-bell-2/nodes/Day_1-a',
  ])('accepts %s', (path) => {
    expect(isNextPath(path)).toBe(true);
  });

  it.each([
    '',
    '/',
    '//evil.com',
    '//evil.com/start',
    'https://x',
    'https://evil.com/start',
    'javascript:alert(1)',
    'start',
    '/admin',
    '/admin/workouts',
    '/play',
    '/summary/1',
    '/book?len=day',
    '/book?len=hour&x=1',
    '/courses/Start',
    '/courses/start/',
    '/courses/start/nodes/',
    '/courses/start/nodes/a/b',
    '/start\n/admin',
  ])('rejects %j', (path) => {
    expect(isNextPath(path)).toBe(false);
  });
});

describe('rememberNext / consumeNext', () => {
  it('keeps a whitelisted destination and gives it back once', () => {
    const store = memory();
    expect(rememberNext('/book?len=hour', store)).toBe(true);
    expect(consumeNext(store)).toBe('/book?len=hour');
    expect(consumeNext(store)).toBeNull();
  });

  it('ignores anything off the list', () => {
    const store = memory();
    expect(rememberNext('/admin', store)).toBe(false);
    expect(rememberNext('//evil.com', store)).toBe(false);
    expect(store.getItem(NEXT_KEY)).toBeNull();
  });

  it('lets a newer redirect off the list clear an older destination', () => {
    const store = memory();
    rememberNext('/duo', store);
    expect(rememberNext('/leaderboard', store)).toBe(false);
    expect(store.getItem(NEXT_KEY)).toBeNull();
    expect(consumeNext(store)).toBeNull();
  });

  it('drops a tampered value and answers null', () => {
    const store = memory();
    store.setItem(NEXT_KEY, 'https://evil.com');
    expect(consumeNext(store)).toBeNull();
    expect(store.getItem(NEXT_KEY)).toBeNull();
  });

  it('survives a store that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(rememberNext('/start', broken)).toBe(false);
    expect(consumeNext(broken)).toBeNull();
    expect(consumeNext(null)).toBeNull();
  });
});
