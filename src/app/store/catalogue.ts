/**
 * Loads the database half of the catalogue and makes it reactive.
 *
 * The catalogue itself lives in `src/content/catalogue.ts`, which has no React in it so the
 * training model can use the same lookups. This store fetches the published courses and the
 * exercise library, converts them into the compiled content's shape and hands them over; the
 * `courses` field exists so components re-render when it lands.
 */
import { create } from 'zustand';
import { allCourses, setCatalogueOverlay } from '@/content/catalogue';
import type { Course, Exercise } from '@/content/schema';
import { listPublishedCourses } from '@/lib/api/courseBuilder';
import { listExerciseCatalog } from '@/lib/api/exercises';
import type { AdminCourseBundle, ExerciseCatalogRow } from '@/lib/api/types';
import { draftToCourse } from '@/lib/courses/draft';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';

export type CatalogueStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CatalogueState {
  status: CatalogueStatus;
  /** Compiled courses plus the published database ones, in catalogue order. */
  courses: readonly Course[];
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * A database exercise, in the compiled library's shape.
 *
 * Several fields exist only to satisfy `Exercise` and are read by almost nothing; the ones that
 * matter are the name, the unit, the per-rep estimate and the media. `animation` is the interesting
 * one — it names a pose set defined in code, so an exercise written in the admin panel has none and
 * the player falls back to its video, which is how a yoga pose should be taught anyway.
 */
export function exerciseFromRow(r: ExerciseCatalogRow): Exercise {
  const name = { ru: r.nameRu, en: r.nameEn ?? r.nameRu };
  const text = (list: { ru?: string; en?: string }[]) =>
    list.map((v) => ({ ru: v.ru ?? v.en ?? '', en: v.en ?? v.ru ?? '' })).filter((v) => v.ru);
  const slug = r.id.replace(/_/g, '-');
  return {
    id: r.id,
    slug: { ru: slug, en: slug },
    name,
    ...(r.shortNameRu ? { shortName: { ru: r.shortNameRu, en: r.shortNameRu } } : {}),
    description: r.descriptionRu
      ? { ru: r.descriptionRu, en: r.descriptionEn ?? r.descriptionRu }
      : name,
    howTo: text(r.howTo),
    cues: text(r.cues),
    mistakes: text(r.mistakes),
    ...(r.breathingRu ? { breathing: { ru: r.breathingRu, en: r.breathingRu } } : {}),
    muscles: (r.muscles.length ? r.muscles : ['full_body']) as Exercise['muscles'],
    pattern: (r.pattern ?? 'mobility') as Exercise['pattern'],
    equipment: (r.equipment.length ? r.equipment : ['none']) as Exercise['equipment'],
    level: (r.level ?? 1) as Exercise['level'],
    unit: r.unit,
    // Required for reps by ExerciseSchema, and the duration estimate needs it either way.
    secondsPerRep: r.secondsPerRep ?? 3,
    // A neutral metabolic equivalent. It only feeds the calorie figure, and a pose written in the
    // admin panel has nobody to ask for a better number.
    met: 3,
    loadable: false,
    scaling: {},
    animation: r.animation ?? '',
    ...(r.videoRu || r.videoEn
      ? {
          video: {
            ...(r.videoRu ? { ru: r.videoRu } : {}),
            ...(r.videoEn ? { en: r.videoEn } : {}),
          },
        }
      : {}),
    tags: r.tags,
    ...(r.isTest ? { isTest: true } : {}),
  };
}

/** A published course bundle, in the compiled content's shape. */
export function courseFromBundle(bundle: AdminCourseBundle): Course {
  const byId = new Map(bundle.workouts.map((w) => [w.id, w]));
  return draftToCourse(
    bundle.course,
    bundle.days.map((d) => ({
      nodeId: d.nodeId,
      week: d.week,
      day: d.day,
      kind: d.kind,
      workoutShortId: d.customWorkoutId ? (byId.get(d.customWorkoutId)?.shortId ?? null) : null,
      deload: d.deload,
      stepsGoal: d.stepsGoal,
      sortOrder: d.sortOrder,
      content: d.content,
    })),
    bundle.workouts.map((w) => ({
      shortId: w.shortId,
      title: w.title,
      description: w.description,
      points: w.points,
      structure: (w.structure ?? { sections: [] }) as CustomWorkoutStructure,
    })),
  ).course;
}

export const useCatalogue = create<CatalogueState>((set, get) => ({
  status: 'idle',
  courses: allCourses(),

  load: async () => {
    if (get().status !== 'idle') return;
    await get().refresh();
  },

  refresh: async () => {
    set({ status: 'loading' });
    try {
      const [bundles, rows] = await Promise.all([listPublishedCourses(), listExerciseCatalog()]);
      setCatalogueOverlay({
        courses: bundles.map(courseFromBundle),
        exercises: rows.map(exerciseFromRow),
      });
      set({ status: 'ready', courses: allCourses() });
    } catch {
      // A catalogue that will not load must not take the app down: the compiled courses still work.
      set({ status: 'error' });
    }
  },
}));
