/**
 * What «Курсы» holds, and in what order. Pure; unit-tested.
 *
 * Every course there is, as one entry each: the ones the athlete owns with how far through them
 * they are, then the ones they do not. «Курсы это прогресс по всем курсам которые есть» — so the
 * order is the order of that answer: the course being followed first, because it is the one being
 * walked today, then the rest of what is owned in catalogue order, then what is not.
 *
 * The club used to be an entry here — the deck was the home screen's «what am I doing» and the
 * club was one of the answers. It has its own tab now, and a tab is not something a list of
 * courses links to, so it left with the deck.
 *
 * Nothing here is localized: a card's words belong to the component that draws it.
 */
import type { Course, CourseNode } from '@/content/schema';
import {
  courseProgress,
  nextNode,
  type CourseProgress,
  type PathState,
} from '@/app/features/path/nodeState';

export type DeckEntry =
  | {
      kind: 'course';
      key: string;
      course: Course;
      progress: CourseProgress;
      /** The day to open next, or null once the course is finished. */
      next: CourseNode | null;
    }
  /**
   * Курс, который не куплен, но открыт для пробы: первая тренировка бесплатна (0019).
   *
   * Отдельный вид, а не `locked` с флагом, потому что карточка у него другая по смыслу: она ведёт
   * внутрь приложения, а не на сайт, и обещает конкретную вещь вместо «Подробнее».
   */
  | { kind: 'preview'; key: string; course: Course; spent: boolean };

export interface DeckInput {
  courses: readonly Course[];
  entitlements: readonly string[];
  /** `user_course_state` by course id, as the progress store holds it. */
  states: Readonly<Record<string, PathState | null | undefined>>;
  /** The course being followed; it leads the list when it is owned. */
  activeCourseId?: string | null;
  /** Курсы, где проба уже потрачена (`my_trained_courses()`). */
  trainedCourseIds?: readonly string[];
}

export function buildDeck({
  courses,
  entitlements,
  states,
  activeCourseId,
  trainedCourseIds = [],
}: DeckInput): DeckEntry[] {
  const owned = courses.filter((c) => entitlements.includes(c.id));
  const locked = courses.filter((c) => !entitlements.includes(c.id));

  // The followed course leads, keeping the catalogue's order behind it.
  const lead = owned.findIndex((c) => c.id === activeCourseId);
  const ordered = lead > 0 ? [owned[lead]!, ...owned.filter((_, i) => i !== lead)] : owned;

  const entries: DeckEntry[] = ordered.map((course) => {
    const state = states[course.id] ?? null;
    return {
      kind: 'course',
      key: `course:${course.id}`,
      course,
      progress: courseProgress(course.nodes, state),
      next: nextNode(course, state),
    };
  });

  /*
   * Некупленные курсы больше не тупик: у каждого есть бесплатная первая тренировка, и карточка
   * ведёт на путь курса, а не на сайт. `spent` отличает того, кто её уже сделал, — ему обещать
   * «бесплатно» нельзя, и кнопка у него сразу про цену.
   */
  const spent = new Set(trainedCourseIds);
  for (const course of locked) {
    entries.push({
      kind: 'preview',
      key: `preview:${course.id}`,
      course,
      spent: spent.has(course.id),
    });
  }

  return entries;
}
