import { describe, expect, it } from 'vitest';
import type { Course, CourseNode } from '@/content/schema';
import { buildDeck } from './deck';

const l = (ru: string) => ({ ru, en: ru });

function node(id: string, i: number): CourseNode {
  return { id, kind: 'workout', title: l(id), week: 1, day: i + 1, workoutId: `w-${id}` };
}

function course(id: string, nodes = 3): Course {
  return {
    id,
    slug: id,
    title: l(id),
    tagline: l(`${id} tagline`),
    weeks: 1,
    sessionsPerWeek: 3,
    tile: '#f2f52d',
    nodes: Array.from({ length: nodes }, (_, i) => node(`${id}-${i + 1}`, i)),
    workouts: [],
  } as unknown as Course;
}

describe('buildDeck', () => {
  const a = course('a');
  const b = course('b');
  const c = course('c');

  it('leads with the course Home is following', () => {
    const deck = buildDeck({
      courses: [a, b, c],
      entitlements: ['a', 'b'],
      states: {},
      activeCourseId: 'b',
    });
    expect(deck.map((d) => d.key)).toEqual(['course:b', 'course:a', 'preview:c']);
  });

  it('keeps the catalogue order when nothing is active', () => {
    const deck = buildDeck({
      courses: [a, b, c],
      entitlements: ['a', 'b'],
      states: {},
    });
    expect(deck.map((d) => d.key)).toEqual(['course:a', 'course:b', 'preview:c']);
  });

  it('carries the course progress and the day to open next', () => {
    const deck = buildDeck({
      courses: [a],
      entitlements: ['a'],
      states: { a: { currentNodeIndex: 1, completedNodeIds: ['a-1'] } },
    });
    const entry = deck[0];
    expect(entry?.kind).toBe('course');
    if (entry?.kind !== 'course') throw new Error('expected a course card');
    expect(entry.progress).toEqual({ done: 1, total: 3, pct: 33 });
    expect(entry.next?.id).toBe('a-2');
  });

  it('has no next day once the course is finished', () => {
    const deck = buildDeck({
      courses: [a],
      entitlements: ['a'],
      states: { a: { currentNodeIndex: 3, completedNodeIds: ['a-1', 'a-2', 'a-3'] } },
    });
    const entry = deck[0];
    if (entry?.kind !== 'course') throw new Error('expected a course card');
    expect(entry.next).toBeNull();
    expect(entry.progress.pct).toBe(100);
  });

  /*
   * Курс, которого нет, больше не тупик: у него бесплатная первая тренировка, и карточка ведёт
   * внутрь приложения. `tried` отличает того, кто её уже сделал, — ему «бесплатно» обещать нельзя.
   */
  it('marks an untried course as a preview and remembers who has already tried one', () => {
    const deck = buildDeck({
      courses: [a, b, c],
      entitlements: [],
      states: {},
      trainedCourseIds: ['b'],
    });
    const preview = deck.filter((d) => d.kind === 'preview');
    expect(preview).toHaveLength(3);
    expect(preview.map((p) => (p.kind === 'preview' ? p.tried : null))).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('says nobody has tried anything when the server list has not arrived', () => {
    const deck = buildDeck({ courses: [a, b, c], entitlements: [], states: {} });
    expect(deck.every((d) => d.kind === 'preview' && !d.tried)).toBe(true);
  });
});
