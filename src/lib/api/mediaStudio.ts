/**
 * «Студия» (0060, 0061): a filmed workout cut into exercise clips, named, graded, framed and sent
 * to the render worker. Every call is re-checked by `is_admin()` on the server.
 *
 * The device never encodes. It cuts the long video into pieces by stream copy, uploads each piece
 * to the private `raw` bucket at {@link rawClipPath}, and registers it with {@link addMediaClip};
 * the worker (`scripts/media/render-clips.mjs`) does the rest and points the exercise at the clip.
 *
 * The mappers are exported and pure so the shapes are tested without a database; the RPCs return
 * snake_case jsonb, and numbers from Postgres (`numeric`) can arrive as strings.
 */
import { parseAutoParams, type AutoParams } from '@/lib/media/autoEnhance';
import { clampCrop, type Crop } from '@/lib/media/crop';
import { clampGrade, GRADE_VERSION, isIdentityGrade, type GradeParams } from '@/lib/media/grade';
import type { VideoMode } from '@/content/schema';
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { guard, unwrap } from './internal';
import { isDemo } from './mode';

export type { AutoParams } from '@/lib/media/autoEnhance';
export type { Crop } from '@/lib/media/crop';
export type { GradeParams } from '@/lib/media/grade';

// --- storage -------------------------------------------------------------------

/** The private bucket the uploaded pieces live in. Admins only, read and write. */
export const RAW_BUCKET = 'raw';

/** The bucket's own per-file ceiling (0060). The project-wide limit may be lower. */
export const RAW_FILE_SIZE_LIMIT = 500 * 1024 * 1024;

/** The longest piece the server accepts, seconds (`media_clips_span`). */
export const MAX_CLIP_SECONDS = 600;

/** The longest keyframe pad the server accepts, seconds. */
export const MAX_RAW_OFFSET_SECONDS = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXT_RE = /^[a-z0-9]{2,5}$/i;
const RAW_PATH_RE = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]{2,5}$/;

/**
 * Where a piece is uploaded inside {@link RAW_BUCKET}: `<source_id>/<clip_id>.<ext>`. The clip id
 * is picked on the device before the upload so a resumed upload lands on the same object and
 * re-registers the same clip.
 */
export function rawClipPath(sourceId: string, clipId: string, ext = 'mp4'): string {
  const e = ext.replace(/^\./, '').toLowerCase();
  if (!UUID_RE.test(sourceId) || !UUID_RE.test(clipId) || !EXT_RE.test(e)) {
    throw new AppError('validation', 'invalid_raw_path');
  }
  return `${sourceId.toLowerCase()}/${clipId.toLowerCase()}.${e}`;
}

// --- types ---------------------------------------------------------------------

export const MEDIA_CLIP_STATUSES = ['draft', 'queued', 'rendering', 'done', 'failed'] as const;
export type MediaClipStatus = (typeof MEDIA_CLIP_STATUSES)[number];

/**
 * How a clip runs in the player (0061): looped, played once and held on its last frame, or one
 * chosen frame. The worker renders a still as a short clip of that frame.
 */
export const PLAY_MODES = ['loop', 'once', 'still'] as const;
export type PlayMode = (typeof PLAY_MODES)[number];

/**
 * The exercise's `video_mode` (0048) a play mode renders to: «once» holds the last frame, which is
 * what `fit` does; a still clip is the same frame throughout, so it simply loops. The SQL twin is
 * `media_video_mode()` in 0061, which `media_render_done` applies.
 */
export function videoModeForPlayMode(mode: PlayMode): VideoMode {
  return mode === 'once' ? 'fit' : 'loop';
}

/** The exercise units a clip's preview tells apart: a timer for seconds, a count otherwise. */
export type ExerciseUnit = 'reps' | 'seconds' | 'meters' | 'calories';

export interface MediaSource {
  id: string;
  title: string;
  fileName: string | null;
  durationS: number | null;
  createdAt: string;
  clips: number;
  done: number;
  /** Queued or rendering. */
  queued: number;
  failed: number;
}

export interface MediaClip {
  id: string;
  sourceId: string;
  exerciseId: string | null;
  /** The exercise's Russian name, for the label. */
  exerciseName: string | null;
  /** The exercise's unit: the preview shows a timer for `seconds`, a rep count otherwise. */
  exerciseUnit: ExerciseUnit | null;
  /** The exercise already has a clip: queueing this one replaces it. */
  exerciseHasVideo: boolean;
  rawPath: string;
  /** Where `startS` is inside the uploaded piece (the keyframe pad). */
  rawOffsetS: number;
  /** Start and end in the source video, seconds. */
  startS: number;
  endS: number;
  /** Null — the whole frame. */
  crop: Crop | null;
  /** Null — no grade. Always clamped, so safe to feed to `gradeToLut`. */
  grade: GradeParams | null;
  gradeVersion: number;
  playMode: PlayMode;
  /** The frame a still clip shows, seconds from the clip's start; null — the worker's default. */
  stillAtS: number | null;
  /** The automatic pass runs before the grade (on by default). */
  autoEnhance: boolean;
  /** What the pass computed at the last render; null before one. */
  autoParams: AutoParams | null;
  status: MediaClipStatus;
  /** The worker's short error, kept while the clip is retried. */
  error: string | null;
  attempts: number;
  renderedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveMediaSourceInput {
  /** Omit for a new source (or pass one picked on the device). */
  id?: string;
  title?: string;
  fileName?: string;
  durationS?: number;
}

export interface AddMediaClipInput {
  /** Picked on the device; the same id as in {@link rawClipPath}. */
  id: string;
  sourceId: string;
  rawPath: string;
  rawOffsetS: number;
  startS: number;
  endS: number;
  exerciseId?: string | null;
  crop?: Crop | null;
}

/** What a save changes; keys left out stay as they are, null clears. */
export interface MediaClipPatch {
  exerciseId?: string | null;
  crop?: Crop | null;
  grade?: GradeParams | null;
  playMode?: PlayMode;
  stillAtS?: number | null;
  autoEnhance?: boolean;
}

/** What a paste carries. A part left out is not pasted; a grade or crop set to null clears it. */
export interface MediaPaste {
  grade?: GradeParams | null;
  crop?: Crop | null;
  autoEnhance?: boolean;
}

// --- mappers -------------------------------------------------------------------

type Num = number | string | null | undefined;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const int = (v: unknown): number => Math.max(0, Math.trunc(num(v) ?? 0));
const text = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);

/** The shape of one element of `admin_media_sources()`. */
export interface DbMediaSource {
  id: string;
  title: string | null;
  file_name: string | null;
  duration_s: Num;
  created_at: string;
  clips: Num;
  done: Num;
  queued: Num;
  failed: Num;
}

/** The shape `media_clip_json()` builds. */
export interface DbMediaClip {
  id: string;
  source_id: string;
  exercise_id: string | null;
  exercise_name: string | null;
  exercise_unit?: string | null;
  exercise_has_video: boolean | null;
  raw_path: string;
  raw_offset_s: Num;
  start_s: Num;
  end_s: Num;
  crop: unknown;
  grade: unknown;
  grade_version: Num;
  play_mode?: string | null;
  still_at_s?: Num;
  auto_enhance?: boolean | null;
  auto_params?: unknown;
  status: string;
  error: string | null;
  attempts: Num;
  rendered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mediaSourceFromDb(r: DbMediaSource): MediaSource {
  return {
    id: r.id,
    title: r.title ?? '',
    fileName: text(r.file_name),
    durationS: num(r.duration_s),
    createdAt: r.created_at,
    clips: int(r.clips),
    done: int(r.done),
    queued: int(r.queued),
    failed: int(r.failed),
  };
}

const asStatus = (v: unknown): MediaClipStatus =>
  MEDIA_CLIP_STATUSES.includes(v as MediaClipStatus) ? (v as MediaClipStatus) : 'draft';

/** A play mode from anything; what is not one loops, as the column's default does. */
export const asPlayMode = (v: unknown): PlayMode =>
  PLAY_MODES.includes(v as PlayMode) ? (v as PlayMode) : 'loop';

const UNITS: readonly ExerciseUnit[] = ['reps', 'seconds', 'meters', 'calories'];
const asUnit = (v: unknown): ExerciseUnit | null =>
  UNITS.includes(v as ExerciseUnit) ? (v as ExerciseUnit) : null;

export function mediaClipFromDb(r: DbMediaClip): MediaClip {
  const grade = r.grade === null || r.grade === undefined ? null : clampGrade(r.grade);
  return {
    id: r.id,
    sourceId: r.source_id,
    exerciseId: text(r.exercise_id),
    exerciseName: text(r.exercise_name),
    exerciseUnit: asUnit(r.exercise_unit),
    exerciseHasVideo: r.exercise_has_video === true,
    rawPath: r.raw_path,
    rawOffsetS: num(r.raw_offset_s) ?? 0,
    startS: num(r.start_s) ?? 0,
    endS: num(r.end_s) ?? 0,
    crop: clampCrop(r.crop),
    grade,
    gradeVersion: int(r.grade_version) || GRADE_VERSION,
    playMode: asPlayMode(r.play_mode),
    stillAtS: num(r.still_at_s),
    // Absent (a server before 0061) reads as the default, on.
    autoEnhance: r.auto_enhance !== false,
    autoParams: parseAutoParams(r.auto_params),
    status: asStatus(r.status),
    error: text(r.error),
    attempts: int(r.attempts),
    renderedAt: r.rendered_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** A grade as stored: null when it changes nothing, so «no grade» has one spelling. */
export function gradeToDb(grade: GradeParams | null | undefined): GradeParams | null {
  if (!grade) return null;
  const g = clampGrade(grade);
  return isIdentityGrade(g) ? null : g;
}

/** A crop as stored: clamped, and null for the whole frame. */
export function cropToDb(crop: Crop | null | undefined): Crop | null {
  return crop ? clampCrop(crop) : null;
}

/** The `p_patch` jsonb `admin_media_save_clip` takes. */
export function clipPatchToDb(patch: MediaClipPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ('exerciseId' in patch) out.exercise_id = patch.exerciseId || null;
  if ('crop' in patch) out.crop = cropToDb(patch.crop);
  if ('grade' in patch) {
    out.grade = gradeToDb(patch.grade);
    out.grade_version = GRADE_VERSION;
  }
  if (patch.playMode !== undefined) out.play_mode = asPlayMode(patch.playMode);
  if ('stillAtS' in patch) out.still_at_s = stillToDb(patch.stillAtS);
  if (patch.autoEnhance !== undefined) out.auto_enhance = patch.autoEnhance;
  return out;
}

/** A still frame as stored: milliseconds, never negative; null for the worker's default. */
export function stillToDb(at: number | null | undefined): number | null {
  if (at === null || at === undefined || !Number.isFinite(at)) return null;
  return Math.max(0, Math.round(at * 1000) / 1000);
}

function validSpan(i: AddMediaClipInput): boolean {
  return (
    Number.isFinite(i.startS) &&
    Number.isFinite(i.endS) &&
    Number.isFinite(i.rawOffsetS) &&
    i.startS >= 0 &&
    i.endS > i.startS &&
    i.endS - i.startS <= MAX_CLIP_SECONDS &&
    i.rawOffsetS >= 0 &&
    i.rawOffsetS <= MAX_RAW_OFFSET_SECONDS
  );
}

const uniqueIds = (ids: readonly string[]): string[] => [...new Set(ids)];

// --- calls ---------------------------------------------------------------------

/** Sources, newest first, with their clip counts (RPC `admin_media_sources`). */
export async function listMediaSources(): Promise<MediaSource[]> {
  if (isDemo()) return (await demo()).listMediaSources();
  return guard(async () => {
    const rows = unwrap<DbMediaSource[]>(await supabase().rpc('admin_media_sources'));
    return rows.map(mediaSourceFromDb);
  });
}

/** Create or rename a source (RPC `admin_media_save_source`). Answers its id. */
export async function saveMediaSource(input: SaveMediaSourceInput): Promise<string> {
  if (input.id !== undefined && !UUID_RE.test(input.id)) {
    throw new AppError('validation', 'invalid_id');
  }
  if (input.title !== undefined && input.title.trim().length > 200) {
    throw new AppError('validation', 'invalid_title');
  }
  if (isDemo()) return (await demo()).saveMediaSource(input);
  return guard(async () =>
    unwrap<string>(
      await supabase().rpc('admin_media_save_source', {
        p_id: input.id ?? null,
        p_title: input.title ?? null,
        p_file_name: input.fileName ?? null,
        p_duration_s: input.durationS ?? null,
      }),
    ),
  );
}

/** Clips of one source, or of all when `sourceId` is null (RPC `admin_media_clips`). */
export async function listMediaClips(sourceId: string | null = null): Promise<MediaClip[]> {
  if (isDemo()) return (await demo()).listMediaClips(sourceId);
  return guard(async () => {
    const rows = unwrap<DbMediaClip[]>(
      await supabase().rpc('admin_media_clips', { p_source_id: sourceId }),
    );
    return rows.map(mediaClipFromDb);
  });
}

/**
 * Register an uploaded piece (RPC `admin_media_add_clip`). Safe to repeat with the same id after
 * a resumed upload: a draft or failed clip takes the new timing, anything later is answered as is.
 */
export async function addMediaClip(input: AddMediaClipInput): Promise<MediaClip> {
  if (!UUID_RE.test(input.id) || !UUID_RE.test(input.sourceId)) {
    throw new AppError('validation', 'invalid_id');
  }
  if (!RAW_PATH_RE.test(input.rawPath)) throw new AppError('validation', 'invalid_raw_path');
  if (!validSpan(input)) throw new AppError('validation', 'invalid_span');
  if (isDemo()) return (await demo()).addMediaClip(input);
  return guard(async () =>
    mediaClipFromDb(
      unwrap<DbMediaClip>(
        await supabase().rpc('admin_media_add_clip', {
          p_id: input.id,
          p_source_id: input.sourceId,
          p_raw_path: input.rawPath,
          p_raw_offset_s: input.rawOffsetS,
          p_start_s: input.startS,
          p_end_s: input.endS,
          p_exercise_id: input.exerciseId ?? null,
          p_crop: cropToDb(input.crop),
        }),
      ),
    ),
  );
}

/**
 * Save a label, crop, grade, play mode or auto switch (RPC `admin_media_save_clip`). Refused with `clip_busy` while the
 * clip renders; a rendered clip that changes comes back as a draft.
 */
export async function saveMediaClip(id: string, patch: MediaClipPatch): Promise<MediaClip> {
  if (isDemo()) return (await demo()).saveMediaClip(id, patch);
  return guard(async () =>
    mediaClipFromDb(
      unwrap<DbMediaClip>(
        await supabase().rpc('admin_media_save_clip', { p_id: id, p_patch: clipPatchToDb(patch) }),
      ),
    ),
  );
}

/**
 * Paste copied settings — a grade, a crop, the auto switch — onto many clips (RPC
 * `admin_media_paste`). Answers how many changed: clips that already match, and clips being
 * rendered, are not counted.
 */
export async function pasteMediaSettings(
  ids: readonly string[],
  paste: MediaPaste,
): Promise<number> {
  const withGrade = 'grade' in paste;
  const withCrop = 'crop' in paste;
  const withAuto = typeof paste.autoEnhance === 'boolean';
  const list = uniqueIds(ids);
  if (list.length === 0 || (!withGrade && !withCrop && !withAuto)) return 0;
  if (isDemo()) return (await demo()).pasteMediaSettings(list, paste);
  return guard(async () =>
    unwrap<number>(
      await supabase().rpc('admin_media_paste', {
        p_ids: list,
        p_grade: withGrade ? gradeToDb(paste.grade) : null,
        p_crop: withCrop ? cropToDb(paste.crop) : null,
        p_with_grade: withGrade,
        p_with_crop: withCrop,
        p_grade_version: GRADE_VERSION,
        p_auto_enhance: withAuto ? paste.autoEnhance : null,
      }),
    ),
  );
}

/**
 * Send clips to the worker (RPC `admin_media_queue`). Unlabelled clips and clips already queued
 * or rendering are left alone; answers how many were queued.
 */
export async function queueMediaClips(ids: readonly string[]): Promise<number> {
  const list = uniqueIds(ids);
  if (list.length === 0) return 0;
  if (isDemo()) return (await demo()).queueMediaClips(list);
  return guard(async () =>
    unwrap<number>(await supabase().rpc('admin_media_queue', { p_ids: list })),
  );
}

/** Put failed clips back in the queue with fresh attempts (RPC `admin_media_retry`). */
export async function retryMediaClips(ids: readonly string[]): Promise<number> {
  const list = uniqueIds(ids);
  if (list.length === 0) return 0;
  if (isDemo()) return (await demo()).retryMediaClips(list);
  return guard(async () =>
    unwrap<number>(await supabase().rpc('admin_media_retry', { p_ids: list })),
  );
}

/**
 * Forget a clip (RPC `admin_media_delete_clip`) and remove its raw piece. The exercise keeps any
 * video already rendered from it. A piece that will not delete is left behind, not an error.
 */
export async function deleteMediaClip(clip: Pick<MediaClip, 'id' | 'rawPath'>): Promise<void> {
  if (isDemo()) return (await demo()).deleteMediaClip(clip);
  return guard(async () => {
    const { error } = await supabase().rpc('admin_media_delete_clip', { p_id: clip.id });
    if (error) throw error;
    await supabase().storage.from(RAW_BUCKET).remove([clip.rawPath]);
  });
}
