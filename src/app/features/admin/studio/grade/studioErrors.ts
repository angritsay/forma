/**
 * What the grade screen says when something fails, in words she can act on.
 *
 * Two kinds of failure reach this screen:
 *
 *  - **a call that failed now** (`AppError` from `src/lib/api/mediaStudio.ts`): no signal, no
 *    rights, a clip the worker has just taken, a value the server refused. Each gets its own line;
 *    anything else stays the screen's own «не удалось сохранить».
 *  - **a render that failed earlier** (`media_clips.error`, written by the worker): a short code
 *    such as `raw_missing`, or the last line of an ffmpeg message with paths cut out. Known codes
 *    become a sentence; an unknown one is shown as it is, under a sentence that says it is the
 *    worker's.
 */
import { isAppError } from '@/lib/api/errors';
import type { TKey } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';

/** Server messages (P0001 / validation) that have their own line. */
const VALIDATION_KEYS: Readonly<Record<string, TKey>> = {
  clip_busy: 'app.studioGradeErrBusy',
  invalid_crop: 'app.studioErrCrop',
  invalid_grade: 'app.studioErrGrade',
  invalid_span: 'app.studioErrSpan',
  invalid_raw_path: 'app.studioErrRawPath',
  unknown_exercise: 'app.studioErrExercise',
  unknown_source: 'app.studioErrSource',
  clip_conflict: 'app.studioErrConflict',
  not_found: 'app.studioErrNotFound',
  invalid_title: 'app.studioErrTitle',
  invalid_duration: 'app.studioErrDuration',
  too_many: 'app.studioErrTooMany',
  invalid_id: 'app.studioErrNotFound',
  invalid_still: 'app.studioErrStill',
  invalid_play_mode: 'app.studioErrPlayMode',
};

/**
 * The line for a failed call, or `fallback`. Null for a lagging database (`schema`): the caller
 * hands that to `adminErrorTitle`, which names the column and the button that fixes it.
 */
export function studioErrorKey(e: unknown, fallback: TKey): TKey | null {
  if (!isAppError(e)) return fallback;
  switch (e.code) {
    case 'schema':
      return null;
    case 'network':
      return 'app.studioErrNetwork';
    case 'auth':
    case 'forbidden':
      return 'app.studioGradeErrPermission';
    case 'not_found':
      return VALIDATION_KEYS[e.message] ?? 'app.studioErrNotFound';
    default:
      return VALIDATION_KEYS[e.message] ?? fallback;
  }
}

/** Worker error codes (`scripts/media/render-clips.mjs`) and what they mean for her. */
const WORKER_KEYS: Readonly<Record<string, TKey>> = {
  raw_missing: 'app.studioWorkerRawMissing',
  bad_raw_path: 'app.studioWorkerRawMissing',
  ffmpeg_timeout: 'app.studioWorkerTimeout',
  grade_version: 'app.studioWorkerGradeVersion',
  invalid_span: 'app.studioWorkerSpan',
  bad_exercise_id: 'app.studioWorkerExercise',
};

export interface WorkerErrorText {
  key: TKey;
  /** The worker's own words, shown small under the sentence; null when the sentence says it all. */
  detail: string | null;
}

export function workerErrorText(error: string | null | undefined): WorkerErrorText {
  const raw = (error ?? '').trim();
  const known = WORKER_KEYS[raw];
  if (known) return { key: known, detail: null };
  return { key: 'app.studioGradeWorkerFailed', detail: raw === '' ? null : raw.slice(0, 200) };
}

/** Why the raw piece will not play in the preview. */
export type PlaybackProblem = 'demo' | 'sign' | 'network' | 'unsupported' | 'decode';

export const PLAYBACK_KEYS: Readonly<Record<PlaybackProblem, TKey>> = {
  demo: 'app.studioPlayDemo',
  sign: 'app.studioPlaySign',
  network: 'app.studioPlayNetwork',
  unsupported: 'app.studioPlayUnsupported',
  decode: 'app.studioPlayDecode',
};

/** A `<video>`'s `MediaError.code` as a problem to show. */
export function mediaErrorProblem(code: number | null | undefined): PlaybackProblem {
  // 1 MEDIA_ERR_ABORTED, 2 MEDIA_ERR_NETWORK, 3 MEDIA_ERR_DECODE, 4 MEDIA_ERR_SRC_NOT_SUPPORTED.
  // An aborted fetch is worth another try, so it reads as the network, not as a bad format.
  if (code === 1 || code === 2) return 'network';
  if (code === 3) return 'decode';
  return 'unsupported';
}

/** The toast line for a failed call: {@link studioErrorKey}, or the lagging-database line. */
export function studioErrorTitle(tr: Translator, e: unknown, fallback: TKey): string {
  const key = studioErrorKey(e, fallback);
  return key === null ? adminErrorTitle(tr, e, fallback) : tr.t(key);
}
