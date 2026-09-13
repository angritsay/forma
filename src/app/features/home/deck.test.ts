import { describe, expect, it } from 'vitest';
import type { Course, CourseNode } from '@/content/schema';
import type { MyMarathon } from '@/lib/api/types';
import { buildDeck, marathonProgress } from './deck';

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

function marathon(id: string, over: Partial<MyMarathon> = {}): MyMarathon {
  return {
    id,
    slug: id,
    title: `Marathon ${id}`,
    description: null,
    status: 'active',
    startsOn: '2026-01-01',
    days: 30,
    teamSize: 2,
    prize: null,
    dayIndex: 5,
    week: 1,
    totalWeeks: 5,
    memberId: 'm1',
    teamId: null,
    teamName: null,
    ...over,
  };
}

describe('marathonProgress', () => {
  it('counts the days behind today, not today itself', () => {
    // Day 1 of 30 is 0%: the day is being lived, nothing of it is done.
    expect(marathonProgress(marathon('a', { dayIndex: 1 }))).toEqual({
      done: 0,
      total: 30,
      pct: 0,
    });
    expect(marathonProgress(marathon('a', { dayIndex: 16 }))).toEqual({
      done: 15,
      total: 30,
      pct: 50,
    });
  });

  it('never runs past the end, or before the start', () => {
    expect(marathonProgress(marathon('a', { dayIndex: 0 })).done).toBe(0);
    expect(marathonProgress(marathon('a', { dayIndex: 99 })).done).toBe(30);
  });
});

describe('buildDeck', () => {
  const a = course('a');
  const b = course('b');
  const c = course('c');

  it('leads with the course Home is following', () => {
    const deck = buildDeck({
      courses: [a, b, c],
      entitlements: ['a', 'b'],
      states: {},
      marathons: [],
      activeCourseId: 'b',
    });
    expect(deck.map((d) => d.key)).toEqual(['course:b', 'course:a', 'locked:c']);
  });

  it('keeps the catalogue order when nothing is active', () => {
    const deck = buildDeck({
      courses: [a, b, c],
      entitlements: ['a', 'b'],
      states: {},
      marathons: [],
    });
    expect(deck.map((d) => d.key)).toEqual(['course:a', 'course:b', 'locked:c']);
  });

  it('puts running marathons between what is owned and what is not', () => {
    const deck = buildDeck({
      courses: [a, c],
      entitlements: ['a'],
      states: {},
      marathons: [marathon('m1')],
    });
    expect(deck.map((d) => d.kind)).toEqual(['course', 'marathon', 'locked']);
  });

  it('leaves out a marathon that has not started or has finished', () => {
    const deck = buildDeck({
      courses: [],
      entitlements: [],
      states: {},
      marathons: [
        marathon('soon', { status: 'draft' }),
        marathon('over', { status: 'finished' }),
        marathon('now'),
      ],
    });
    expect(deck.map((d) => d.key)).toEqual(['marathon:now']);
  });

  it('carries the course progress and the day to open next', () => {
    const deck = buildDeck({
      courses: [a],
      entitlements: ['a'],
      states: { a: { currentNodeIndex: 1, completedNodeIds: ['a-1'] } },
      marathons: [],
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
      marathons: [],
    });
    const entry = deck[0];
    if (entry?.kind !== 'course') throw new Error('expected a course card');
    expect(entry.next).toBeNull();
    expect(entry.progress.pct).toBe(100);
  });
});
