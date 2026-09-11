/**
 * The exercise library in the database (`public.exercises`): read by the workout builder and the
 * admin catalogue, marked up (video, tags) by admins, and — since 0008 — authored by them.
 *
 * The 90 exercises the product shipped with are generated from `content/exercises` by
 * 0007_exercise_seed.sql and stay owned by those files. Anything created here is marked
 * `is_custom`, which is what keeps a re-seed from overwriting it. A course whose movements are not
 * in the compiled library — yoga, say — is built entirely out of these.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type { ExerciseCatalogRow, ExerciseDraft, ExerciseMarkupPatch } from './types';

interface DbExercise {
  id: string;
  name_ru: string;
  name_en: string | null;
  short_name_ru: string | null;
  description_ru: string | null;
  description_en: string | null;
  how_to: unknown;
  cues: unknown;
  mistakes: unknown;
  breathing_ru: string | null;
  primary_muscle: string | null;
  muscles: string[] | null;
  pattern: string | null;
  equipment: string[] | null;
  level: number | null;
  unit: ExerciseCatalogRow['unit'];
  seconds_per_rep: number | string | null;
  animation: string | null;
  video_ru: string | null;
  video_en: string | null;
  image: string | null;
  tags: string[] | null;
  is_test: boolean;
  is_custom: boolean;
}

/** A jsonb column that should hold [{ru,en}] but came from the database, so trust nothing. */
function textList(value: unknown): { ru?: string; en?: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({
      ...(typeof v.ru === 'string' ? { ru: v.ru } : {}),
      ...(typeof v.en === 'string' ? { en: v.en } : {}),
    }))
    .filter((v) => v.ru || v.en);
}

/** numeric arrives as a string from PostgREST. */
const num = (v: number | string | null): number | null => {
  if (v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

function fromDb(r: DbExercise): ExerciseCatalogRow {
  return {
    id: r.id,
    nameRu: r.name_ru,
    nameEn: r.name_en,
    shortNameRu: r.short_name_ru,
    descriptionRu: r.description_ru,
    descriptionEn: r.description_en,
    howTo: textList(r.how_to),
    cues: textList(r.cues),
    mistakes: textList(r.mistakes),
    breathingRu: r.breathing_ru,
    primaryMuscle: r.primary_muscle,
    muscles: r.muscles ?? [],
    pattern: r.pattern,
    equipment: r.equipment ?? [],
    level: r.level,
    unit: r.unit,
    secondsPerRep: num(r.seconds_per_rep),
    animation: r.animation,
    videoRu: r.video_ru,
    videoEn: r.video_en,
    image: r.image,
    tags: r.tags ?? [],
    isTest: r.is_test,
    isCustom: r.is_custom,
  };
}

function draftToDb(draft: Partial<ExerciseDraft>): Record<string, unknown> {
  const db: Record<string, unknown> = {};
  if (draft.nameRu !== undefined) db.name_ru = draft.nameRu;
  if (draft.nameEn !== undefined) db.name_en = draft.nameEn || null;
  if (draft.shortNameRu !== undefined) db.short_name_ru = draft.shortNameRu || null;
  if (draft.descriptionRu !== undefined) db.description_ru = draft.descriptionRu || null;
  if (draft.descriptionEn !== undefined) db.description_en = draft.descriptionEn || null;
  if (draft.howTo !== undefined) db.how_to = draft.howTo;
  if (draft.cues !== undefined) db.cues = draft.cues;
  if (draft.mistakes !== undefined) db.mistakes = draft.mistakes;
  if (draft.breathingRu !== undefined) db.breathing_ru = draft.breathingRu || null;
  if (draft.primaryMuscle !== undefined) db.primary_muscle = draft.primaryMuscle || null;
  if (draft.muscles !== undefined) db.muscles = draft.muscles;
  if (draft.pattern !== undefined) db.pattern = draft.pattern || null;
  if (draft.equipment !== undefined) db.equipment = draft.equipment;
  if (draft.level !== undefined) db.level = draft.level;
  if (draft.unit !== undefined) db.unit = draft.unit;
  if (draft.secondsPerRep !== undefined) db.seconds_per_rep = draft.secondsPerRep;
  if (draft.videoRu !== undefined) db.video_ru = draft.videoRu || null;
  if (draft.videoEn !== undefined) db.video_en = draft.videoEn || null;
  if (draft.image !== undefined) db.image = draft.image || null;
  if (draft.tags !== undefined) db.tags = draft.tags;
  if (draft.isTest !== undefined) db.is_test = draft.isTest;
  return db;
}

/** The whole catalogue, ordered for a picker. */
export async function listExerciseCatalog(): Promise<ExerciseCatalogRow[]> {
  if (isDemo()) return (await demo()).listExerciseCatalog();
  return guard(async () => {
    const rows = unwrap<DbExercise[]>(
      await supabase()
        .from('exercises')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true }),
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

/**
 * Admin-only: author a new exercise.
 *
 * `is_custom` is set here rather than defaulted in the table, so the only rows carrying it are the
 * ones that came through this function. `sort_order` 1000 puts new exercises after the seeded 90
 * instead of interleaving with ids the generator owns.
 */
export async function createExercise(draft: ExerciseDraft): Promise<ExerciseCatalogRow> {
  if (isDemo()) return (await demo()).createExercise(draft);
  return guard(async () => {
    const row = unwrap<DbExercise>(
      await supabase()
        .from('exercises')
        .insert({
          ...draftToDb(draft),
          id: draft.id,
          name_ru: draft.nameRu,
          is_custom: true,
          sort_order: 1000,
        })
        .select('*')
        .single(),
    );
    return fromDb(row);
  });
}

/** Admin-only: edit any field of an exercise. */
export async function updateExercise(
  id: string,
  draft: Partial<ExerciseDraft>,
): Promise<ExerciseCatalogRow> {
  if (isDemo()) return (await demo()).updateExercise(id, draft);
  return guard(async () => {
    const row = unwrap<DbExercise>(
      await supabase().from('exercises').update(draftToDb(draft)).eq('id', id).select('*').single(),
    );
    return fromDb(row);
  });
}

/**
 * Admin-only: delete an exercise.
 *
 * Restricted to admin-authored rows: a seeded one would come straight back on the next re-seed,
 * and deleting it would empty a block of the compiled course that uses it.
 */
export async function deleteExercise(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteExercise(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('exercises').delete().eq('id', id).eq('is_custom', true));
  });
}
