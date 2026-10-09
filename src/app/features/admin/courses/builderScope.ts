/**
 * Who the course builder is working for: the owner (every course, publish) or one creator (their
 * own courses, «send for review») — 0065, docs/PLATFORM.md phase 2 step 1.
 *
 * The same two screens serve both (`AdminCoursesScreen`, `AdminCourseScreen`); this module holds
 * the few rules that differ, as pure functions so they have a test. The server enforces every one
 * of them again (RLS and the guard trigger in 0065); these only keep the screen from offering what
 * would be refused.
 */
import type { TKey } from '@/i18n/index';
import { isAppError } from '@/lib/api/errors';
import type { AdminCourseRow, MyCreator } from '@/lib/api/types';

export type BuilderScope =
  | { kind: 'admin' }
  | {
      kind: 'creator';
      creatorId: string;
      /** False while the creator is paused: they read their courses and change nothing. */
      open: boolean;
    };

export const ADMIN_SCOPE: BuilderScope = { kind: 'admin' };

/** The scope for a creator row, or null when the person is not (or not yet) a creator. */
export function creatorScope(me: MyCreator | null): BuilderScope | null {
  if (!me || (me.status !== 'active' && me.status !== 'paused')) return null;
  return { kind: 'creator', creatorId: me.id, open: me.status === 'active' };
}

/** Where the list of courses lives for this scope; a course is `<base>/<id>`. */
export function coursesBase(scope: BuilderScope): string {
  return scope.kind === 'admin' ? '/admin/courses' : '/creator/courses';
}

/**
 * The storage folder uploads go under. A creator writes only below `creators/<id>/` (0065); the
 * owner keeps the conventions of 0003 / 0008. Every path the builder makes starts with this.
 */
export function mediaPrefix(scope: BuilderScope): string {
  return scope.kind === 'creator' ? `creators/${scope.creatorId}/` : '';
}

/** The course is waiting for the owner's review. */
export function inReview(course: Pick<AdminCourseRow, 'reviewRequestedAt'>): boolean {
  return !!course.reviewRequestedAt;
}

/**
 * Can this scope change the course? The owner always (a compiled course aside, which the screen
 * handles on its own). A creator only an editable draft of theirs: never published, not waiting
 * for review, and only while open — the same rule as `creator_can_edit_course()`.
 */
export function canEditCourse(
  scope: BuilderScope,
  course: Pick<AdminCourseRow, 'status' | 'publishedAt' | 'reviewRequestedAt' | 'creatorId'>,
): boolean {
  if (scope.kind === 'admin') return true;
  return (
    scope.open &&
    course.creatorId === scope.creatorId &&
    course.status === 'draft' &&
    !course.publishedAt &&
    !inReview(course)
  );
}

/** Why a creator's course is read-only, for the line that says so; null when it is editable. */
export function creatorLock(
  scope: BuilderScope,
  course: Pick<AdminCourseRow, 'status' | 'publishedAt' | 'reviewRequestedAt' | 'creatorId'>,
): 'paused' | 'review' | 'published' | null {
  if (scope.kind === 'admin') return null;
  if (course.status === 'published' || course.publishedAt) return 'published';
  if (inReview(course)) return 'review';
  if (!scope.open) return 'paused';
  return null;
}

/** Server words the builder can come back with (0008, 0065), and the line each one gets. */
const SERVER_WORDS: Record<string, TKey> = {
  course_too_short: 'app.courseErrTooShort',
  course_has_empty_days: 'app.courseErrEmptyDays',
  slug_taken: 'app.courseErrSlugTaken',
  price_out_of_range: 'app.courseErrPrice',
  creator_paused: 'app.courseLockPaused',
};

/** The specific line for a builder error, or null to fall back to the screen's own. */
export function builderErrorKey(e: unknown): TKey | null {
  if (!isAppError(e)) return null;
  const word = SERVER_WORDS[e.message];
  if (word) return word;
  // A unique violation on `slug_id`: somebody's course already has this id.
  return /duplicate key/i.test(e.message) && /slug_id/i.test(e.message)
    ? 'app.courseErrSlugTaken'
    : null;
}
