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
import { EXERCISE_BY_ID, FILMED_EXERCISES, coursesUsingExercise } from '@/content/registry';
import { l, t } from '@/i18n/index';

/** The neutral tile (--tile-4, --surface-2) for an exercise that is not (yet) in any course. */
export const DEFAULT_TILE = '#2e2e2e';

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

/**
 * Exercises grouped by movement pattern in MOVEMENT_PATTERNS order; empty groups are skipped.
 *
 * The default list is the filmed one, like everywhere else in this module: every function here
 * feeds a public page, and a public page may only name a movement that has one
 * (`content/registry.ts`, FILMED_EXERCISES). A caller that genuinely wants the whole library — the
 * admin, a fixture — passes it in.
 */
export function exercisesByPattern(
  locale: Locale,
  list: readonly Exercise[] = FILMED_EXERCISES,
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

export function exerciseTile(ex: Exercise): string {
  const course = primaryCourse(ex);
  return course ? course.tile : DEFAULT_TILE;
}

/**
 * The easier and harder versions, *as links*.
 *
 * Unfilmed neighbours are dropped rather than returned, because this is what draws «Проще» and
 * «Сложнее» on the public page and those are anchors. `air_squat`'s harder version is `jump_squat`,
 * which has no clip and therefore no page; returning it would have printed a link to a 404 on the
 * one page in the library people actually reach. The app's own scaling does not come through here —
 * it reads `ex.scaling` directly and still sees everything.
 */
export function scalingExercises(ex: Exercise): { easier?: Exercise; harder?: Exercise } {
  const linkable = (id: string | undefined): Exercise | undefined => {
    const e = id ? EXERCISE_BY_ID.get(id) : undefined;
    return e?.video ? e : undefined;
  };
  return {
    easier: linkable(ex.scaling.easier),
    harder: linkable(ex.scaling.harder),
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
  list: readonly Exercise[] = FILMED_EXERCISES,
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
