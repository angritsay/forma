import { describe, expect, it } from 'vitest';
import { hasAside, mainOnly } from './mainWork';

const kindOf = (p: { kind: string }) => p.kind;
const parts = (...kinds: string[]) => kinds.map((kind) => ({ kind }));

describe('mainOnly', () => {
  it('drops the warm-up and the cool-down and keeps the order of the rest', () => {
    const list = parts('warmup', 'strength', 'metcon', 'cooldown');
    expect(mainOnly(list, kindOf).map(kindOf)).toEqual(['strength', 'metcon']);
  });

  it('keeps every kind of real work, whatever it is called', () => {
    const list = parts('skill', 'strength', 'metcon', 'core', 'test');
    expect(mainOnly(list, kindOf)).toHaveLength(list.length);
  });

  /*
   * День мобилити — это одна разминка и ничего больше. Отфильтровать её значило бы показать
   * пустое место там, где обещан план; показать её — сказать правду о том, что будет.
   */
  it('shows the warm-up rather than nothing when that is the whole workout', () => {
    const list = parts('warmup', 'cooldown');
    expect(mainOnly(list, kindOf).map(kindOf)).toEqual(['warmup', 'cooldown']);
  });

  it('answers an empty workout with an empty plan', () => {
    expect(mainOnly([], kindOf)).toEqual([]);
  });
});

describe('hasAside', () => {
  it('is true only when something was actually hidden', () => {
    expect(hasAside(parts('warmup', 'metcon'), kindOf)).toBe(true);
    expect(hasAside(parts('metcon'), kindOf)).toBe(false);
    // Всё скрыть нельзя, значит и сказать «часть скрыта» тут было бы неправдой.
    expect(hasAside(parts('warmup'), kindOf)).toBe(false);
  });
});
