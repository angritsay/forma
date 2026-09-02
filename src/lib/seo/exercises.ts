/**
 * Exercise-library helpers for the programmatic /exercises pages: grouping, related items,
 * scaling links, generated FAQ, vocabulary lookups.
 */
import {
  MOVEMENT_PATTERNS,
  type Course,
  type Equipment,
  type Exercise,
  type ExerciseUnit,
  type Level,
  type Locale,
  type MovementPattern,
  type MuscleGroup,
} from '@/content/schema';
import { EXERCISE_BY_ID, EXERCISES, coursesUsingExercise } from '@/content/registry';
import { l, t } from '@/i18n/index';

/** Brand mint → sky, used when an exercise is not (yet) part of any course. */
export const DEFAULT_GRADIENT: [string, string] = ['#B9F3E0', '#C9D6FF'];

export function patternName(pattern: MovementPattern, locale: Locale): string {
  return t(locale, `seo.pattern_${pattern}` as const);
}
export function muscleName(muscle: MuscleGroup, locale: Locale): string {
  return t(locale, `seo.muscle_${muscle}` as const);
}
export function equipmentName(eq: Equipment, locale: Locale): string {
  return t(locale, `common.equipment_${eq}` as const);
}
export function unitName(unit: ExerciseUnit, locale: Locale): string {
  return t(locale, `seo.unit_${unit}` as const);
}
export function levelName(level: Level, locale: Locale): string {
  return t(locale, `common.level_${level}` as const);
}

export function equipmentNames(ex: Exercise, locale: Locale): string[] {
  return ex.equipment.map((eq) => equipmentName(eq, locale));
}

export function sortExercises(list: readonly Exercise[], locale: Locale): Exercise[] {
  return [...list].sort(
    (a, b) => a.level - b.level || l(a.name, locale).localeCompare(l(b.name, locale), locale),
  );
}

/** Exercises grouped by movement pattern in MOVEMENT_PATTERNS order; empty groups are skipped. */
export function exercisesByPattern(
  locale: Locale,
  list: readonly Exercise[] = EXERCISES,
): { pattern: MovementPattern; items: Exercise[] }[] {
  const out: { pattern: MovementPattern; items: Exercise[] }[] = [];
  for (const pattern of MOVEMENT_PATTERNS) {
    const items = sortExercises(
      list.filter((e) => e.pattern === pattern),
      locale,
    );
    if (items.length) out.push({ pattern, items });
  }
  return out;
}

/** First course (by display order) that programs the exercise. */
export function primaryCourse(ex: Exercise): Course | undefined {
  return coursesUsingExercise(ex.id)[0];
}

export function exerciseGradient(ex: Exercise): [string, string] {
  const course = primaryCourse(ex);
  return course ? [course.gradient[0], course.gradient[1]] : DEFAULT_GRADIENT;
}

export function scalingExercises(ex: Exercise): { easier?: Exercise; harder?: Exercise } {
  return {
    easier: ex.scaling.easier ? EXERCISE_BY_ID.get(ex.scaling.easier) : undefined,
    harder: ex.scaling.harder ? EXERCISE_BY_ID.get(ex.scaling.harder) : undefined,
  };
}

/**
 * Related exercises: same pattern first, then shared muscles, then same equipment.
 * Returns between `min` (when the library allows) and `max` items, never the exercise itself.
 */
export function relatedExercises(
  ex: Exercise,
  locale: Locale,
  min = 3,
  max = 6,
  list: readonly Exercise[] = EXERCISES,
): Exercise[] {
  const others = list.filter((e) => e.id !== ex.id);
  const picked: Exercise[] = [];
  const add = (candidates: Exercise[]) => {
    for (const c of sortExercises(candidates, locale)) {
      if (picked.length >= max) return;
      if (!picked.includes(c)) picked.push(c);
    }
  };
  add(others.filter((e) => e.pattern === ex.pattern));
  if (picked.length < min) add(others.filter((e) => e.muscles.some((m) => ex.muscles.includes(m))));
  if (picked.length < min)
    add(others.filter((e) => e.equipment.some((eq) => ex.equipment.includes(eq))));
  return picked;
}

/** Public (http/https) video URL for the locale; `storage:` references are app-only. */
export function publicVideoUrl(ex: Exercise, locale: Locale): string | undefined {
  const v = ex.video?.[locale] ?? ex.video?.ru ?? ex.video?.en;
  return v && /^https?:\/\//i.test(v) ? v : undefined;
}

/** "Heels lift off the floor." → "heels lift off the floor" (keeps acronyms like RPE). */
function toClause(sentence: string): string {
  const s = sentence.trim().replace(/[.!?…]+$/, '');
  const first = s.charAt(0);
  const second = s.charAt(1);
  const startsWithAcronym =
    second !== '' && second === second.toUpperCase() && /\p{L}/u.test(second);
  return startsWithAcronym ? s : first.toLowerCase() + s.slice(1);
}

function clauseList(items: readonly { ru: string; en: string }[], locale: Locale): string {
  return `${items.map((it) => toClause(l(it, locale))).join('; ')}.`;
}

/**
 * 2–3 FAQ items generated from the exercise copy (mistakes, cues, then breathing / scaling /
 * equipment). Answers are the coach's own text, only re-phrased into Q&A form.
 */
export function exerciseFaq(ex: Exercise, locale: Locale): { q: string; a: string }[] {
  const name = l(ex.name, locale);
  const out: { q: string; a: string }[] = [
    {
      q: t(locale, 'seo.faqMistakesQ', { name }),
      a: t(locale, 'seo.faqMistakesA', { list: clauseList(ex.mistakes, locale) }),
    },
    {
      q: t(locale, 'seo.faqCuesQ', { name }),
      a: t(locale, 'seo.faqCuesA', { list: clauseList(ex.cues, locale) }),
    },
  ];
  if (ex.breathing) {
    out.push({ q: t(locale, 'seo.faqBreathingQ', { name }), a: l(ex.breathing, locale) });
    return out;
  }
  const { easier, harder } = scalingExercises(ex);
  if (easier || harder) {
    const parts: string[] = [];
    if (easier) parts.push(t(locale, 'seo.faqScalingEasier', { name: l(easier.name, locale) }));
    if (harder) parts.push(t(locale, 'seo.faqScalingHarder', { name: l(harder.name, locale) }));
    out.push({ q: t(locale, 'seo.faqScalingQ', { name }), a: parts.join(' ') });
    return out;
  }
  const gear = ex.equipment.filter((eq) => eq !== 'none');
  out.push({
    q: t(locale, 'seo.faqEquipmentQ', { name }),
    a: gear.length
      ? t(locale, 'seo.faqEquipmentA', {
          list: gear.map((eq) => equipmentName(eq, locale).toLowerCase()).join(', '),
        })
      : t(locale, 'seo.faqEquipmentNone'),
  });
  return out;
}
