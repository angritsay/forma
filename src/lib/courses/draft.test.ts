import { describe, expect, it } from 'vitest';
import { CourseSchema } from '@/content/schema';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import {
  clampBasePoints,
  draftToCourse,
  parseCourseContent,
  parseDayContent,
  slugFromId,
  type CourseDayDraft,
  type CourseDraft,
  type WorkoutDraft,
} from './draft';

const structure = (exerciseId: string, unit: 'reps' | 'seconds'): CustomWorkoutStructure => ({
  sections: [
    {
      kind: 'warmup',
      format: 'circuit',
      sets: 1,
      items: [{ exerciseId: 'cat_cow', unit: 'reps', target: 8, restAfterSec: 0 }],
    },
    {
      kind: 'main',
      format: 'circuit',
      sets: 3,
      restBetweenRoundsSec: 60,
      items: [
        { exerciseId, unit, target: 45, perSide: true, restAfterSec: 15, note: 'Ровное дыхание' },
      ],
    },
  ],
});

const workout = (shortId: string, points: number | null = 120): WorkoutDraft => ({
  shortId,
  title: 'Поток A',
  description: 'Мягкая последовательность',
  points,
  structure: structure('child_pose', 'seconds'),
});

const day = (
  nodeId: string,
  sortOrder: number,
  over: Partial<CourseDayDraft> = {},
): CourseDayDraft => ({
  nodeId,
  week: 1,
  day: sortOrder + 1,
  kind: 'workout',
  workoutShortId: 'y_flow_a',
  deload: false,
  stepsGoal: null,
  sortOrder,
  content: { title: { ru: `День ${sortOrder + 1}` }, body: [] },
  ...over,
});

/** A draft with everything CourseSchema demands, so tests can take pieces away from it. */
function completeDraft(): CourseDraft {
  return {
    slugId: 'yoga_start',
    sortOrder: 6,
    level: 1,
    weeks: 4,
    sessionsPerWeek: 3,
    avgSessionMin: 30,
    equipment: ['mat'],
    tile: '#1A2634',
    priceRub: 4900,
    priceUsd: 59,
    content: parseCourseContent({
      slug: { ru: 'yoga-start', en: 'yoga-start' },
      name: { ru: 'Йога с нуля' },
      tagline: { ru: 'Четыре недели мягкой практики' },
      description: { ru: 'Курс для тех, кто никогда не занимался йогой.' },
      longDescription: [{ ru: 'Первый абзац.' }, { ru: 'Второй абзац.' }],
      forWhom: [{ ru: 'Новичкам' }, { ru: 'Тем, кто много сидит' }],
      outcomes: [{ ru: 'Подвижность' }, { ru: 'Спокойствие' }, { ru: 'Привычка' }],
      faq: [
        { q: { ru: 'Нужен ли коврик?' }, a: { ru: 'Да.' } },
        { q: { ru: 'Сколько длится?' }, a: { ru: '30 минут.' } },
        { q: { ru: 'А если я не гибкая?' }, a: { ru: 'Это нормально.' } },
      ],
    }),
  };
}

const fourDays = (): CourseDayDraft[] => [
  day('d1', 0),
  day('d2', 1, { kind: 'rest', workoutShortId: null, stepsGoal: 8000 }),
  day('d3', 2),
  day('d4', 3, { kind: 'test' }),
];

describe('draftToCourse', () => {
  it('assembles a publishable course that satisfies CourseSchema', () => {
    const { course, issues } = draftToCourse(completeDraft(), fourDays(), [workout('y_flow_a')]);
    expect(issues).toEqual([]);
    expect(CourseSchema.safeParse(course).success).toBe(true);
    expect(course.id).toBe('yoga_start');
    expect(course.nodes).toHaveLength(4);
    expect(course.workouts).toHaveLength(1);
  });

  it('reports what is still missing instead of throwing', () => {
    const draft = completeDraft();
    draft.content.outcomes = [{ ru: 'Только один' }];
    const { issues } = draftToCourse(draft, fourDays(), [workout('y_flow_a')]);
    expect(issues.length).toBeGreaterThan(0);
    // A course with too few days is the other half of what publish refuses.
    const short = draftToCourse(completeDraft(), [day('d1', 0)], [workout('y_flow_a')]);
    expect(short.issues.length).toBeGreaterThan(0);
  });

  it('turns builder sections into blocks, preserving unit, per-side, rest and note', () => {
    const { course } = draftToCourse(completeDraft(), fourDays(), [workout('y_flow_a')]);
    const [warmup, main] = course.workouts[0]!.blocks;
    expect(warmup!.type).toBe('warmup');
    expect(warmup!.items[0]).toMatchObject({ exerciseId: 'cat_cow', reps: 8 });
    // A reps item must not also carry seconds: WorkoutItemSchema allows exactly one measure.
    expect(warmup!.items[0]).not.toHaveProperty('seconds');
    expect(main!.type).toBe('strength');
    expect(main!.sets).toBe(3);
    expect(main!.restBetweenRoundsSec).toBe(60);
    expect(main!.items[0]).toMatchObject({
      exerciseId: 'child_pose',
      seconds: 45,
      perSide: true,
      restAfterSec: 15,
      note: { ru: 'Ровное дыхание', en: 'Ровное дыхание' },
    });
  });

  it('includes only the workouts the days actually use', () => {
    const { course } = draftToCourse(completeDraft(), fourDays(), [
      workout('y_flow_a'),
      workout('y_flow_unused'),
    ]);
    expect(course.workouts.map((w) => w.id)).toEqual(['y_flow_a']);
  });

  it('orders days by sortOrder, not by the order they arrive in', () => {
    const days = [day('d4', 3, { kind: 'test' }), day('d1', 0), day('d3', 2), day('d2', 1)];
    const { course } = draftToCourse(completeDraft(), days, [workout('y_flow_a')]);
    expect(course.nodes.map((n) => n.id)).toEqual(['d1', 'd2', 'd3', 'd4']);
  });

  it('carries rest-day fields onto the node', () => {
    const { course } = draftToCourse(completeDraft(), fourDays(), [workout('y_flow_a')]);
    const rest = course.nodes.find((n) => n.kind === 'rest')!;
    expect(rest.stepsGoal).toBe(8000);
    expect(rest.workoutId).toBeUndefined();
  });

  it('falls the English half back to the Russian rather than leaving it empty', () => {
    const { course } = draftToCourse(completeDraft(), fourDays(), [workout('y_flow_a')]);
    expect(course.name).toEqual({ ru: 'Йога с нуля', en: 'Йога с нуля' });
  });

  it('defaults the URL slug to a kebab-cased id', () => {
    const draft = completeDraft();
    delete draft.content.slug;
    const { course, issues } = draftToCourse(draft, fourDays(), [workout('y_flow_a')]);
    expect(course.slug).toEqual({ ru: 'yoga-start', en: 'yoga-start' });
    expect(issues).toEqual([]);
  });
});

describe('clampBasePoints', () => {
  it('keeps the scoring ceiling inside the range the content model allows', () => {
    // These must agree with admin_publish_course() in 0008_course_builder.sql, which writes the
    // same number into public.workouts as the server-side ceiling.
    expect(clampBasePoints(120)).toBe(120);
    expect(clampBasePoints(10)).toBe(60);
    expect(clampBasePoints(375)).toBe(250);
    expect(clampBasePoints(null)).toBe(100);
    expect(clampBasePoints(Number.NaN)).toBe(100);
  });
});

describe('parsing stored blobs', () => {
  it('returns an empty draft for junk rather than throwing', () => {
    expect(parseCourseContent(null).longDescription).toEqual([]);
    expect(parseCourseContent({ name: 42 }).name).toBeUndefined();
    expect(parseDayContent(undefined).body).toEqual([]);
  });

  it('round-trips a written blob', () => {
    const parsed = parseDayContent({
      title: { ru: 'День 1', en: 'Day 1' },
      body: [{ ru: 'Пара слов.' }],
      image: 'images/courses/yoga/d1.jpg',
    });
    expect(parsed.title).toEqual({ ru: 'День 1', en: 'Day 1' });
    expect(parsed.body).toHaveLength(1);
    expect(parsed.image).toBe('images/courses/yoga/d1.jpg');
  });
});

describe('slugFromId', () => {
  it('kebab-cases an id', () => {
    expect(slugFromId('yoga_start')).toBe('yoga-start');
    expect(slugFromId('start')).toBe('start');
  });
});
