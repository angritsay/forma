/**
 * The exercise library in the database (`public.exercises`): read by the workout builder and the
 * admin catalogue, marked up (video, tags) by admins. Base fields are seeded from content.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, unwrap } from './internal';
import { isDemo } from './mode';
import type { ExerciseCatalogRow, ExerciseMarkupPatch } from './types';

interface DbExercise {
  id: string;
  name_ru: string;
  name_en: string | null;
  short_name_ru: string | null;
  primary_muscle: string | null;
  muscles: string[] | null;
  pattern: string | null;
  equipment: string[] | null;
  level: number | null;
  unit: ExerciseCatalogRow['unit'];
  animation: string | null;
  video_ru: string | null;
  video_en: string | null;
  tags: string[] | null;
  is_test: boolean;
}

function fromDb(r: DbExercise): ExerciseCatalogRow {
  return {
    id: r.id,
    nameRu: r.name_ru,
    nameEn: r.name_en,
    shortNameRu: r.short_name_ru,
    primaryMuscle: r.primary_muscle,
    muscles: r.muscles ?? [],
    pattern: r.pattern,
    equipment: r.equipment ?? [],
    level: r.level,
    unit: r.unit,
    animation: r.animation,
    videoRu: r.video_ru,
    videoEn: r.video_en,
    tags: r.tags ?? [],
    isTest: r.is_test,
  };
}

/** The whole catalogue, ordered for a picker. */
export async function listExerciseCatalog(): Promise<ExerciseCatalogRow[]> {
  if (isDemo()) return (await demo()).listExerciseCatalog();
  return guard(async () => {
    const rows = unwrap<DbExercise[]>(
      await supabase().from('exercises').select('*').order('sort_order', { ascending: true }),
    );
    return rows.map(fromDb);
  });
}

/** Admin-only: update the hand-editable markup on one exercise. */
export async function updateExerciseMarkup(
  id: string,
  patch: ExerciseMarkupPatch,
): Promise<ExerciseCatalogRow> {
  if (isDemo()) return (await demo()).updateExerciseMarkup(id, patch);
  return guard(async () => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.videoRu !== undefined) dbPatch.video_ru = patch.videoRu || null;
    if (patch.videoEn !== undefined) dbPatch.video_en = patch.videoEn || null;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    const row = unwrap<DbExercise>(
      await supabase().from('exercises').update(dbPatch).eq('id', id).select('*').single(),
    );
    return fromDb(row);
  });
}
