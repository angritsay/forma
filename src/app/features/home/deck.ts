/**
 * What the home screen's deck holds, and in what order. Pure; unit-tested.
 *
 * Everything a person can be *in* is one card: a course they own, a marathon they are running, a
 * course they have not bought yet. The deck is the home screen's answer to "what am I doing", so
 * the order is the order of that answer — the course being followed, then the marathons, which are
 * time-boxed and shout louder than they last, then the rest of what is owned, then what is not.
 *
 * Nothing here is localized: a card's words belong to the component that draws it.
 */
import type { Course, CourseNode } from '@/content/schema';
import type { MyMarathon } from '@/lib/api/types';
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
  | { kind: 'marathon'; key: string; marathon: MyMarathon; progress: CourseProgress }
  | { kind: 'locked'; key: string; course: Course };

export interface DeckInput {
  courses: readonly Course[];
  entitlements: readonly string[];
  /** `user_course_state` by course id, as the progress store holds it. */
  states: Readonly<Record<string, PathState | null | undefined>>;
  marathons: readonly MyMarathon[];
  /** The course Home follows; it leads the deck when it is owned. */
  activeCourseId?: string | null;
}

/**
 * Days done out of days total, for a marathon.
 *
 * `dayIndex` is the day being lived, so the days *behind* it are the ones finished — day one of
 * thirty is 0%, not 3%, because nothing has been done yet. It says where the marathon is, not how
 * much of it the person completed: whether today's task is sent is the card's other line.
 */
export function marathonProgress(m: MyMarathon): CourseProgress {
  const total = Math.max(0, m.days);
  const done = Math.max(0, Math.min(total, m.dayIndex - 1));
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function buildDeck({
  courses,
  entitlements,
  states,
  marathons,
  activeCourseId,
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

  // Only a marathon that has actually started: one announced for next month is not today's work.
  for (const m of marathons) {
    if (m.status !== 'active') continue;
    entries.push({
      kind: 'marathon',
      key: `marathon:${m.id}`,
      marathon: m,
      progress: marathonProgress(m),
    });
  }

  for (const course of locked) {
    entries.push({ kind: 'locked', key: `locked:${course.id}`, course });
  }

  return entries;
}
