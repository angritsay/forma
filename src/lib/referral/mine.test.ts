import { describe, expect, it } from 'vitest';
import { MY_NAME_KEY, MY_REF_KEY, forgetMyRef, myRef, rememberMyRef } from './mine';

function memory(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

describe('the cached own code', () => {
  it('keeps the code and the first name', () => {
    const store = memory();
    expect(rememberMyRef('abcd1234', 'Настя Иванова', store)).toBe(true);
    expect(myRef(store)).toEqual({ code: 'abcd1234', name: 'Настя' });
  });

  it('stores no code in a foreign shape, and no name that is not a name', () => {
    const store = memory();
    expect(rememberMyRef('ABCD1234', 'Настя', store)).toBe(false);
    expect(store.getItem(MY_REF_KEY)).toBeNull();
    rememberMyRef('abcd1234', '<b>', store);
    expect(store.getItem(MY_NAME_KEY)).toBeNull();
  });

  it('drops an old name when the new profile has none', () => {
    const store = memory();
    rememberMyRef('abcd1234', 'Настя', store);
    rememberMyRef('abcd1234', null, store);
    expect(myRef(store).name).toBeNull();
  });

  it('reads back only valid values', () => {
    const store = memory();
    store.setItem(MY_REF_KEY, 'nope');
    store.setItem(MY_NAME_KEY, 'Аня1');
    expect(myRef(store)).toEqual({ code: null, name: null });
  });

  it('forgets both with the session', () => {
    const store = memory();
    rememberMyRef('abcd1234', 'Настя', store);
    forgetMyRef(store);
    expect(myRef(store)).toEqual({ code: null, name: null });
    expect(myRef(null)).toEqual({ code: null, name: null });
  });
});
