/**
 * Which exercises the workout builder offers: the filmed ones only (`FILMED_EXERCISES`).
 *
 * The library was written ahead of the camera, and the database mirrors all of it. A workout built
 * from a movement nobody has shot plays with no demonstration where the clip should be — the one
 * thing the player is for — so the picker leaves those out, the same boundary the site and the
 * library already draw.
 *
 * "Filmed" is either half: a compiled exercise with a clip in `content/`, or a row the admin has
 * given a clip in the media library (0048), which the catalogue lays over the compiled exercise
 * (`mediaOverlay`) or plays as it is for an exercise authored in the admin.
 */
import { isFilmed } from '@/content/registry';
import type { ExerciseCatalogRow } from '@/lib/api/types';

export function isPickable(row: ExerciseCatalogRow): boolean {
  return isFilmed(row.id) || Boolean(row.videoRu || row.videoEn);
}

export function pickableExercises(rows: readonly ExerciseCatalogRow[]): ExerciseCatalogRow[] {
  return rows.filter(isPickable);
}
