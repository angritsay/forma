/** Course-level lookups and labels shared by the Home rows and the Courses screen. */
import { EXERCISE_BY_ID } from '@/content/registry';
import type { Course, Equipment, Exercise, Locale } from '@/content/schema';
import { plural } from '@/i18n/index';
import { href } from '@/lib/util/paths';
import type { Translator } from '@/app/hooks/useT';
import { workoutSignatureExercise } from '@/app/features/path/plan';

/** The exercise whose figure represents the course: from its first real workout. */
export function courseSignatureExercise(course: Course): Exercise | undefined {
  const node =
    course.nodes.find((n) => n.kind === 'workout' && n.workoutId) ??
    course.nodes.find((n) => n.workoutId);
  const workout = node?.workoutId
    ? course.workouts.find((w) => w.id === node.workoutId)
    : course.workouts[0];
  const fromWorkout = workout ? workoutSignatureExercise(workout) : undefined;
  if (fromWorkout) return fromWorkout;
  const first = course.workouts[0]?.blocks[0]?.items[0];
  return first ? EXERCISE_BY_ID.get(first.exerciseId) : undefined;
}

/** Landing course page (same site, base-prefixed) — where a locked course is bought. */
export function courseLandingHref(locale: Locale, course: Course): string {
  return href(locale, `/courses/${course.slug[locale]}/`);
}

export function isBodyweightCourse(course: Course): boolean {
  return course.equipment.every((e) => e === 'none' || e === 'mat');
}

/** Equipment worth a chip: `['none']` for bodyweight courses, else the real gear. */
export function courseEquipmentForDisplay(course: Course): Equipment[] {
  if (isBodyweightCourse(course)) return ['none'];
  return course.equipment.filter((e) => e !== 'none' && e !== 'mat');
}

export function weeksLabel(tr: Translator, n: number): string {
  const word = plural(tr.locale, n, {
    one: tr.t('app.coursesWeekWordOne'),
    few: tr.t('app.coursesWeekWordFew'),
    many: tr.t('app.coursesWeekWordMany'),
  });
  return `${n} ${word}`;
}

export function perWeekLabel(tr: Translator, n: number): string {
  return plural(tr.locale, n, {
    one: tr.t('app.coursesPerWeekOne', { n }),
    few: tr.t('app.coursesPerWeekFew', { n }),
    many: tr.t('app.coursesPerWeekMany', { n }),
  });
}
