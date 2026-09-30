import { describe, expect, it } from 'vitest';
import { EXERCISES, FILMED_EXERCISES } from '@/content/registry';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import { isPickable, pickableExercises } from './filmed';

/** A catalogue row with only the fields the rule reads. */
const row = (id: string, video: string | null = null): ExerciseCatalogRow =>
  ({ id, videoRu: video, videoEn: null }) as ExerciseCatalogRow;

describe('the workout builder picker', () => {
  it('offers every filmed compiled exercise', () => {
    for (const ex of FILMED_EXERCISES) expect(isPickable(row(ex.id)), ex.id).toBe(true);
  });

  it('leaves out a compiled exercise nobody has filmed', () => {
    const unfilmed = EXERCISES.find((e) => !e.video);
    expect(unfilmed).toBeDefined();
    expect(isPickable(row(unfilmed!.id))).toBe(false);
  });

  it('counts a clip the admin attached in the media library', () => {
    expect(isPickable(row('admin_authored', 'storage:video/x.mp4'))).toBe(true);
    expect(isPickable(row('admin_authored'))).toBe(false);
  });

  it('keeps the catalogue order', () => {
    const filmed = FILMED_EXERCISES.slice(0, 2).map((e) => row(e.id));
    const list = [filmed[0]!, row('nope'), filmed[1]!];
    expect(pickableExercises(list)).toEqual(filmed);
  });
});
