/**
 * Small pure helpers shared by landing pages and components: labels, links and course lookups.
 * Build-time only (imports the content registry).
 */
import { EXERCISE_BY_ID } from '@/content/registry';
import type {
  Block,
  Course,
  CourseNode,
  Equipment,
  Exercise,
  Level,
  Locale,
  Workout,
  WorkoutItem,
} from '@/content/schema';
import { formatNumber, plural, t } from '@/i18n/index';
import { href } from '@/lib/util/paths';

/** Default steps goal for rest nodes (docs/SPEC.md §6). */
export const DEFAULT_STEPS_GOAL = 7000;

/** Site path (no base, no locale) of a course page. */
export function coursePath(locale: Locale, course: Course): string {
  return `/courses/${course.slug[locale]}/`;
}

export function courseHref(locale: Locale, course: Course): string {
  return href(locale, coursePath(locale, course));
}

export function exercisePath(locale: Locale, exercise: Exercise): string {
  return `/exercises/${exercise.slug[locale]}/`;
}

export function exerciseHref(locale: Locale, exercise: Exercise): string {
  return href(locale, exercisePath(locale, exercise));
}

/** First "workout" node (skipping the baseline test), falling back to any node with a workout. */
export function firstWorkoutNode(course: Course): CourseNode | undefined {
  return (
    course.nodes.find((n) => n.kind === 'workout' && n.workoutId) ??
    course.nodes.find((n) => n.workoutId)
  );
}

/** The workout shown as "sample workout" / used by the difficulty demo. */
export function sampleWorkout(course: Course): Workout | undefined {
  const node = firstWorkoutNode(course);
  const byNode = node?.workoutId ? course.workouts.find((w) => w.id === node.workoutId) : undefined;
  return byNode ?? course.workouts[0];
}

/** The exercise whose figure represents the course: first item of the first non-warm-up block. */
export function signatureExercise(course: Course): Exercise | undefined {
  const workout = sampleWorkout(course);
  if (!workout) return undefined;
  const block =
    workout.blocks.find((b) => b.type !== 'warmup' && b.type !== 'cooldown') ?? workout.blocks[0];
  const item = block?.items[0];
  return item ? EXERCISE_BY_ID.get(item.exerciseId) : undefined;
}

export function equipmentLabel(locale: Locale, eq: Equipment): string {
  return t(locale, `common.equipment_${eq}`);
}

export function levelLabel(locale: Locale, level: Level): string {
  return t(locale, `common.level_${level}`);
}

export function weeksLabel(locale: Locale, n: number): string {
  const word = plural(locale, n, {
    one: t(locale, 'landing.weekWordOne'),
    few: t(locale, 'landing.weekWordFew'),
    many: t(locale, 'landing.weekWordMany'),
  });
  return `${n} ${word}`;
}

export function sessionsLabel(locale: Locale, n: number): string {
  const word = plural(locale, n, {
    one: t(locale, 'landing.workoutWordOne'),
    few: t(locale, 'landing.workoutWordFew'),
    many: t(locale, 'landing.workoutWordMany'),
  });
  return t(locale, 'landing.sessionsPerWeek', { n, word });
}

export function coursesCountLabel(locale: Locale, n: number): string {
  const word = plural(locale, n, {
    one: t(locale, 'landing.courseWordOne'),
    few: t(locale, 'landing.courseWordFew'),
    many: t(locale, 'landing.courseWordMany'),
  });
  return t(locale, 'landing.chipCourses', { n, word });
}

/** True when the course needs nothing beyond a mat. */
export function isBodyweightCourse(course: Course): boolean {
  return course.equipment.every((e) => e === 'none' || e === 'mat');
}

/** Equipment chips worth showing (drops the implicit "mat" when real equipment is listed). */
export function courseEquipmentForDisplay(course: Course): Equipment[] {
  if (isBodyweightCourse(course)) return ['none'];
  return course.equipment.filter((e) => e !== 'none' && e !== 'mat');
}

export function nodeKindLabel(locale: Locale, node: CourseNode): string {
  switch (node.kind) {
    case 'workout':
      return t(locale, 'landing.nodeWorkout');
    case 'rest':
      return t(locale, 'landing.nodeRest', {
        steps: formatNumber(locale, node.stepsGoal ?? DEFAULT_STEPS_GOAL),
      });
    case 'test':
      return t(locale, 'landing.nodeTest');
    case 'benchmark':
      return t(locale, 'landing.nodeBenchmark');
    case 'milestone':
      return t(locale, 'landing.nodeMilestone');
  }
}

export interface WeekGroup {
  week: number;
  deload: boolean;
  nodes: CourseNode[];
}

export function groupNodesByWeek(course: Course): WeekGroup[] {
  const groups: WeekGroup[] = [];
  for (const node of course.nodes) {
    let g = groups.find((x) => x.week === node.week);
    if (!g) {
      g = { week: node.week, deload: false, nodes: [] };
      groups.push(g);
    }
    g.nodes.push(node);
    if (node.deload) g.deload = true;
  }
  return groups.sort((a, b) => a.week - b.week);
}

/** Human label for a block's format and volume: "3 rounds", "AMRAP · 12 min", "20s on / 10s off × 8". */
export function blockMetaLabel(locale: Locale, block: Block): string {
  const format = t(locale, `training.format_${block.format}`);
  switch (block.format) {
    case 'sets':
      return `${format} · ${t(locale, 'landing.blockSets', { n: block.sets ?? 1 })}`;
    case 'circuit':
      return `${format} · ${t(locale, 'landing.blockRounds', { n: block.sets ?? 1 })}`;
    case 'amrap':
    case 'fortime':
      return `${format} · ${t(locale, 'landing.blockMinutes', {
        n: Math.round((block.durationSec ?? 0) / 60),
      })}`;
    case 'emom':
      return `${format} · ${t(locale, 'landing.blockMinutes', { n: block.rounds ?? 1 })}`;
    case 'tabata':
    case 'interval':
      return `${format} · ${t(locale, 'landing.blockTabata', {
        work: block.workSec ?? 0,
        rest: block.restSec ?? 0,
        n: block.rounds ?? 8,
      })}`;
  }
}

/** "12 reps", "30 sec", "200 m", "10 cal" (+ "per side"). */
export function itemTargetLabel(locale: Locale, item: WorkoutItem): string {
  let out = '';
  if (item.reps !== undefined) out = `${item.reps} ${t(locale, 'training.reps')}`;
  else if (item.seconds !== undefined) out = `${item.seconds} ${t(locale, 'training.seconds')}`;
  else if (item.meters !== undefined) out = `${item.meters} ${t(locale, 'training.meters')}`;
  else if (item.calories !== undefined) out = `${item.calories} ${t(locale, 'training.calories')}`;
  if (item.perSide) out += ` ${t(locale, 'training.perSide')}`;
  if (item.load) out += ` · ${t(locale, `training.load_${item.load}`)}`;
  return out;
}

/** Trim a text to a meta-description length at a word boundary. */
export function metaDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 60 ? space : cut.length).replace(/[,;:—-]$/, '')}…`;
}

/** Equipment values present across courses, in schema order. */
export function equipmentAcrossCourses(courses: readonly Course[], order: readonly Equipment[]) {
  const present = new Set<Equipment>();
  for (const c of courses) for (const e of courseEquipmentForDisplay(c)) present.add(e);
  return order.filter((e) => present.has(e));
}

export function levelsAcrossCourses(courses: readonly Course[]): Level[] {
  const present = new Set<Level>();
  for (const c of courses) present.add(c.level);
  return ([1, 2, 3] as const).filter((lv) => present.has(lv));
}
