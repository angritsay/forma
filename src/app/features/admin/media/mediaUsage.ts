/**
 * Which exercises point at which files.
 *
 * The media library lists what is in a bucket; this is what lets it say, next to a file, who
 * would lose it — and refuse to delete a file that something still plays. Pure over the catalogue
 * rows so the screen and the test read the same answer.
 */
import type { ExerciseCatalogRow } from '@/lib/api/types';

/** Every media reference an exercise row carries, in a fixed order. */
export function refsOf(row: ExerciseCatalogRow): string[] {
  const out: (string | null | undefined)[] = [
    row.videoRu,
    row.videoEn,
    row.audioRu,
    row.audioEn,
    row.image,
  ];
  for (const intro of [row.introFull, row.introBrief]) {
    if (!intro) continue;
    out.push(intro.video, intro.audio?.ru, intro.audio?.en);
  }
  return out
    .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
    .map((r) => r.trim());
}

/** `storage:` reference → ids of the exercises that use it, each id once, in catalogue order. */
export function refsByExercise(rows: readonly ExerciseCatalogRow[]): Map<string, string[]> {
  const byRef = new Map<string, string[]>();
  for (const row of rows) {
    for (const ref of refsOf(row)) {
      const ids = byRef.get(ref) ?? [];
      if (!ids.includes(row.id)) ids.push(row.id);
      byRef.set(ref, ids);
    }
  }
  return byRef;
}

/**
 * A file name safe for a bucket path: lower-case Latin, digits, dot, dash and underscore.
 *
 * Storage accepts more, but a space or a Cyrillic letter in a key turns every reference to it
 * into an encoding question; the app's own convention is `<id>.<lang>.<ext>` and this keeps an
 * upload from the library inside it. Runs of anything else collapse to one dash; a name with
 * nothing left becomes `file`.
 */
export function safeFileName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'file';
}
